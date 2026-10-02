// Front page Aktuelt per the design: the «Snarvei under Aktuelt» card (Dugnad) isn't in it any more (dugnad shows in
// «I borettslaget nå»), so the field is removed; and the fifth news category «Sosialt» (sand, heart) is created.
//   node --env-file=.env scripts/migrate/forside-aktuelt.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/forside-aktuelt.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { KATEGORIER } from './aktuelt-data.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SOSIALT = KATEGORIER.find((k) => k._id === 'nyhetskategori-sosialt');
const { forside, utkast, sosialt } = await client.fetch(`{
  "forside": *[_id == "forside"][0],
  "utkast": *[_id == "drafts.forside"]._id,
  "sosialt": *[_type == "nyhetskategori" && (_id == $id || lower(tittel) == "sosialt")][0]._id
}`, { id: SOSIALT._id });
if (utkast.length) throw new Error('The front page has an unpublished draft. Publish or discard it in the Studio first.');
const fjern = !!forside?.snarvei;
if (!fjern && sosialt) { console.log('Nothing to do (already migrated?).'); process.exit(0); }
if (fjern) console.log(`forside.snarvei ${JSON.stringify({ merkelapp: forside.snarvei.merkelapp, tittel: forside.snarvei.tittel })} ⇒ removed`);
if (!sosialt) console.log(`create ${SOSIALT._id} («${SOSIALT.tittel}», ${SOSIALT.farge}, ${SOSIALT.ikon})`);
else console.log(`Sosialt exists already (${sosialt}), not created`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-forside-aktuelt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([forside], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
if (fjern) tx.patch(client.patch('forside').ifRevisionId(forside._rev).unset(['snarvei']));
if (!sosialt) tx.createIfNotExists(SOSIALT);
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}, then delete Sosialt.`);
