// News as blocks: the four news categories become documents (`nyhetskategori`, editable) and `nyhet.kategori` a
// reference to them; each item's body becomes a block list (`seksjoner`, like pages): its facts (date, place) → a
// fact box first, the rich text → text/image blocks, the related page → a link row block last. Attachments
// (`dokumenter`) stay as they are.
//   node --env-file=.env scripts/migrate/nyheter-blokker.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/nyheter-blokker.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { KATEGORIER, tilBlokker } from './aktuelt-data.mjs';
import { oversikt } from './seksjoner-lib.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const { nyheter, utkast, finnes } = await client.fetch(`{
  "nyheter": *[_type == "nyhet" && !(_id in path("drafts.**")) && (!defined(seksjoner) || defined(innhold) || defined(fakta) || defined(relatert) || !defined(kategori._ref))],
  "utkast": *[_type == "nyhet" && _id in path("drafts.**")]._id,
  "finnes": *[_type == "nyhetskategori"]._id
}`);
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);
const nyeKategorier = KATEGORIER.filter((k) => !finnes.includes(k._id));
if (!nyheter.length && !nyeKategorier.length) { console.log('Nothing to do (already migrated?).'); process.exit(0); }
const ny = tilBlokker;

for (const k of nyeKategorier) console.log(`create ${k._id} («${k.tittel}», ${k.farge}, ${k.ikon})`);
for (const n of nyheter) {
  const x = ny(n);
  console.log(`${n._id} («${n.tittel}»)\n  kategori ${JSON.stringify(n.kategori)} ⇒ ${x.kategori._ref}\n  seksjoner ⇒ ${oversikt(x.seksjoner)}\n  unset innhold, fakta, relatert`);
}
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-nyheter-blokker-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(nyheter, null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const k of nyeKategorier) tx.createIfNotExists(k);
for (const n of nyheter) tx.patch(client.patch(n._id).ifRevisionId(n._rev).set(ny(n)).unset(['innhold', 'fakta', 'relatert']));
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}, then delete the nyhetskategori-* documents.`);
