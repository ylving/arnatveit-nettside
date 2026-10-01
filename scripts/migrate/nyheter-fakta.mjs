// Date and place back as fields (the article header shows them as white pills): a news item's fact box that holds only
// "Dato"/"Sted" rows becomes `fakta` { dato, sted } and the block is removed. Other fact boxes stay blocks.
//   node --env-file=.env scripts/migrate/nyheter-fakta.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/nyheter-fakta.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { faktaFraBlokk } from './aktuelt-data.mjs';
import { oversikt } from './seksjoner-lib.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const { nyheter, utkast } = await client.fetch(`{
  "nyheter": *[_type == "nyhet" && !(_id in path("drafts.**")) && count(seksjoner[_type == "faktaboks"]) > 0 && !defined(fakta)],
  "utkast": *[_type == "nyhet" && _id in path("drafts.**")]._id
}`);
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);

const endringer = nyheter.flatMap((n) => {
  const blokk = n.seksjoner.find((b) => faktaFraBlokk(b));
  return blokk ? [{ n, fakta: faktaFraBlokk(blokk), seksjoner: n.seksjoner.filter((b) => b !== blokk) }] : [];
});
if (!endringer.length) { console.log('Nothing to do (already migrated?).'); process.exit(0); }
for (const { n, fakta, seksjoner } of endringer) {
  console.log(`${n._id} («${n.tittel}»)\n  fakta ⇒ ${fakta.dato ?? '–'}, ${fakta.sted ?? '–'}\n  seksjoner: ${oversikt(n.seksjoner)} ⇒ ${oversikt(seksjoner)}`);
}
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-nyheter-fakta-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(endringer.map((e) => e.n), null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const { n, fakta, seksjoner } of endringer) tx.patch(client.patch(n._id).ifRevisionId(n._rev).set({ fakta, seksjoner }));
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
