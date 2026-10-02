// Front page: the static train tag («Infokort i toppen»: «Tog til Bergen sentrum» / «Avgang hvert kvarter fra Arna»)
// is replaced by the live departures card (TogKort.astro, /api/tog). Removes the now unused field.
//   node --env-file=.env scripts/migrate/forside-infokort.mjs --dry   show the change, write nothing
//   node --env-file=.env scripts/migrate/forside-infokort.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const { forside, utkast } = await client.fetch(`{ "forside": *[_id == "forside"][0], "utkast": *[_id == "drafts.forside"]._id }`);
if (utkast.length) throw new Error('The front page has an unpublished draft. Publish or discard it in the Studio first.');
if (!forside?.infokort) { console.log('Nothing to do: no infokort on the front page.'); process.exit(0); }
console.log(`forside.infokort ${JSON.stringify(forside.infokort)} ⇒ removed`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-forside-infokort-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([forside], null, 2));
console.log(`\nBackup: ${backup}`);
await client.patch('forside').ifRevisionId(forside._rev).unset(['infokort']).commit();
console.log(`Done. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
