// Events: "Hva skjer" section on Dugnad and Miljøutvalget; Miljøutvalget's member list grouped by tun,
// with the extended planting committee as a toggle (`beplanting`) instead of a role text.
//   node --env-file=.env scripts/migrate/arrangementer.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/arrangementer.mjs         back up, then write (restore: seksjoner.mjs --gjenopprett <file>)
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const IDS = ['side-dugnad', 'side-miljoutvalget', 'utvalg-miljoutvalget'];
const docs = await client.fetch('*[_id in $ids]', { ids: [...IDS, ...IDS.map((id) => `drafts.${id}`)] });
const utkast = docs.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them in the Studio first.`);
const doc = Object.fromEntries(docs.map((d) => [d._id, d]));

const hvaSkjer = (kategori) => ({ _type: 'arrangementer', _key: 'hva-skjer', tittel: 'Hva skjer', kategori, bredde: 'bred' });
const plan = [];

// Dugnad: "Hva skjer" first, the rest unchanged
const dugnad = doc['side-dugnad'];
if (!dugnad.seksjoner.some((s) => s._type === 'arrangementer')) plan.push({ doc: dugnad, set: { seksjoner: [hvaSkjer('dugnad'), ...dugnad.seksjoner] } });

// Miljøutvalget: "Hva skjer", then the member list. The placeholder text ("På denne siden vil informasjon om slikt
// bli lagt ut." + heading "Utvalget består av") is replaced by the events and the list's own heading.
const miljo = doc['side-miljoutvalget'];
const liste = miljo.seksjoner.find((s) => s._type === 'medlemsliste');
if (!miljo.seksjoner.some((s) => s._type === 'arrangementer')) {
  plan.push({
    doc: miljo,
    set: {
      seksjoner: [
        hvaSkjer('sosialt'),
        { ...liste, tittel: 'Utvalget', ingress: 'Miljøutvalget har medlemmer fra alle tre tun.', visning: 'tun' },
        ...miljo.seksjoner.filter((s) => s._type !== 'tekst' && s._key !== liste._key),
      ],
    },
  });
}

// Planting committee: role text → toggle
const utvalg = doc['utvalg-miljoutvalget'];
const plante = utvalg.medlemmer.filter((m) => m.rolle === 'Utvidet beplantingsutvalg');
if (plante.length) {
  plan.push({
    doc: utvalg,
    set: Object.fromEntries(plante.map((m) => [`medlemmer[_key=="${m._key}"].beplanting`, true])),
    unset: plante.map((m) => `medlemmer[_key=="${m._key}"].rolle`),
  });
}

for (const p of plan) {
  console.log(`\n${p.doc._id}`);
  if (p.set.seksjoner) console.log('  seksjoner:', p.doc.seksjoner.map((s) => s._type).join(' → '), '  ⇒  ', p.set.seksjoner.map((s) => s._type).join(' → '));
  else console.log('  set:', p.set, '\n  unset:', p.unset);
}
if (!plan.length) { console.log('Nothing to do: already migrated.'); process.exit(0); }
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-arrangementer-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(plan.map((p) => p.doc), null, 2));
console.log(`\nBackup: ${backup}`);

const tx = client.transaction();
for (const p of plan) {
  let patch = client.patch(p.doc._id).ifRevisionId(p.doc._rev).set(p.set);
  if (p.unset) patch = patch.unset(p.unset);
  tx.patch(patch);
}
const res = await tx.commit();
console.log(`Updated ${res.results.length} documents. Undo with: node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
