// ABC-nytt per the design: every issue (a `dokument` in category ABC-nytt) becomes an `abcUtgave` (month, year,
// the same PDF asset, old addresses kept for redirects); the old documents and the category are deleted.
// The page gets the design's ingress and the `abcUtgaver` section; the Karneval text is kept below it (decided
// 2026-09-30). Irene Myking is marked "Ansvarlig for ABC-nytt". Covers: scripts/abc-forsider.mjs afterwards.
//   node --env-file=.env scripts/migrate/abc-nytt.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/abc-nytt.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-abc-nytt';
const KATEGORI = 'kategori-abc-nytt';
const STYRET = 'utvalg-styret';
const REDAKTOR = 'Irene Myking';

const { side, styret, utgaver, utkast, finnes, refererte } = await client.fetch(`{
  "side": *[_id == $side][0],
  "styret": *[_id == $styret][0],
  "utgaver": *[_type == "dokument" && kategori._ref == $kategori] | order(dato asc),
  "utkast": *[_id in path("drafts.**") && (_id in ["drafts." + $side, "drafts." + $styret] || _type in ["dokument", "abcUtgave"])]._id,
  "finnes": count(*[_type == "abcUtgave"]),
  "refererte": *[references(*[_type == "dokument" && kategori._ref == $kategori]._id)]._id
}`, { side: SIDE, styret: STYRET, kategori: KATEGORI });
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);
if (finnes) { console.log(`Nothing to do: ${finnes} ABC-nytt issues already exist (already migrated?).`); process.exit(0); }
if (refererte.length) throw new Error(`Other documents link to ABC-nytt issues (${refererte.join(', ')}); relink them first.`);

const nye = utgaver.map((d) => {
  const [aar, maaned] = (d.dato ?? '').split('-').map(Number);
  if (!aar || !maaned) throw new Error(`${d._id} (${d.tittel}) has no month`);
  return {
    _id: `abc-${aar}-${String(maaned).padStart(2, '0')}`, _type: 'abcUtgave', aar, maaned,
    fil: { _type: 'file', asset: d.fil.asset }, ...(d.gamleUrler?.length && { gamleUrler: d.gamleUrler }), fra: d,
  };
});
const dobbel = nye.filter((u, i) => nye.findIndex((v) => v._id === u._id) !== i);
if (dobbel.length) throw new Error(`Two issues for the same month: ${dobbel.map((u) => u._id).join(', ')}`);

const karneval = side.seksjoner.find((s) => s._key === 'tk1x');
if (!karneval || karneval.innhold?.[0]?.children?.[0]?.text !== 'Karneval') throw new Error('The Karneval text section does not look as expected; not touching the page.');
const INGRESS = 'Borettslagets informasjonsblad. Det kommer ut rundt seks ganger i året, i postkassen og her.';
const seksjoner = [
  { _type: 'abcUtgaver', _key: 'utgaver', innspillTittel: 'Har du noe til neste nummer?', innspillTekst: 'Tips, bilder og beskjeder til naboene er velkomne.', bredde: 'bred' },
  karneval,
];
const redaktor = styret.medlemmer.find((m) => m.navn === REDAKTOR);
if (!redaktor) throw new Error(`${REDAKTOR} is not in Styret`);

console.log(`${nye.length} issues → abcUtgave, e.g.`);
for (const u of [...nye.slice(0, 2), ...nye.slice(-2)]) console.log(`  ${u.fra.tittel} (${u.fra._id})  ⇒  ${u._id}${u.gamleUrler ? `  [${u.gamleUrler.join(', ')}]` : ''}`);
console.log(`  without old addresses: ${nye.filter((u) => !u.gamleUrler).length}`);
console.log(`delete ${utgaver.length} documents and ${KATEGORI}`);
console.log(`${SIDE}\n  ingress: ${side.ingress}\n        ⇒  ${INGRESS}`);
console.log('  seksjoner:', side.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '));
console.log(`${STYRET}: ${REDAKTOR} (${redaktor._key}) → Ansvarlig for ABC-nytt`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-abc-nytt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
// An array of whole documents, so seksjoner.mjs --gjenopprett can restore it (the new abc-* issues must then be deleted by hand)
fs.writeFileSync(backup, JSON.stringify([side, styret, await client.getDocument(KATEGORI), ...utgaver], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const { fra, ...u } of nye) tx.create(u);
for (const d of utgaver) tx.delete(d._id);
tx.patch(client.patch(SIDE).ifRevisionId(side._rev).set({ ingress: INGRESS, seksjoner }));
tx.patch(client.patch(STYRET).ifRevisionId(styret._rev).set({ [`medlemmer[_key=="${redaktor._key}"].abcRedaktor`]: true }));
tx.delete(KATEGORI);
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Next: node --env-file=.env scripts/abc-forsider.mjs`);
