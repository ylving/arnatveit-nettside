// Aktuelt per the design: every news item gets a category (from its old free-text tag, else Informasjon) and loses
// `merkelapp` and `fremhevet`; the 2026 general assembly item also gets its facts (date, place) and a link row to
// Generalforsamling («Alle protokoller»). The menu item «Nytt» becomes «Aktuelt» (same address, /aktuelt).
//   node --env-file=.env scripts/migrate/aktuelt.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/aktuelt.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { GF_2026, MENY, kategoriFraMerkelapp } from './aktuelt-data.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const GF = 'nyhet-generalforsamling-2026';
const { nyheter, innst, utkast } = await client.fetch(`{
  "nyheter": *[_type == "nyhet" && !(_id in path("drafts.**"))],
  "innst": *[_id == "innstillinger"][0],
  "utkast": *[_id in path("drafts.**") && (_type == "nyhet" || _id == "drafts.innstillinger")]._id
}`);
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);

const endringer = nyheter.filter((n) => !n.kategori || n.merkelapp !== undefined || n.fremhevet !== undefined || (n._id === GF && !n.fakta));
const meny = (innst.hovedmeny ?? []).map((l) => (l.tekst === MENY.fra && l.url === '/aktuelt' ? { ...l, tekst: MENY.til } : l));
const menyEndres = meny.some((l, i) => l !== innst.hovedmeny[i]);
if (!endringer.length && !menyEndres) { console.log('Nothing to do (already migrated?).'); process.exit(0); }

const nytt = (n) => ({ kategori: n.kategori ?? kategoriFraMerkelapp(n.merkelapp), ...(n._id === GF && { fakta: GF_2026.fakta, relatert: GF_2026.relatert }) });
for (const n of endringer) {
  const x = nytt(n);
  console.log(`${n._id} («${n.tittel}»)\n  merkelapp ${JSON.stringify(n.merkelapp)}, fremhevet ${n.fremhevet} ⇒ removed\n  kategori ⇒ ${x.kategori}${x.fakta ? `\n  fakta ⇒ ${x.fakta.dato}, ${x.fakta.sted}\n  relatert ⇒ ${x.relatert.side._ref} «${x.relatert.tittel}» / «${x.relatert.tekst}»` : ''}`);
}
if (menyEndres) console.log(`innstillinger.hovedmeny: «${MENY.fra}» ⇒ «${MENY.til}» (/aktuelt)`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-aktuelt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([innst, ...endringer], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const n of endringer) tx.patch(client.patch(n._id).ifRevisionId(n._rev).set(nytt(n)).unset(['merkelapp', 'fremhevet']));
if (menyEndres) tx.patch(client.patch('innstillinger').ifRevisionId(innst._rev).set({ hovedmeny: meny }));
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
