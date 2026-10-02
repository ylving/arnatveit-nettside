// Om oss og kontakt: turn on the map in the «Området» band (fargebaand `omradet`, `kart: true`).
//   node --env-file=.env scripts/migrate/omradet-kart.mjs --dry   show the change, write nothing
//   node --env-file=.env scripts/migrate/omradet-kart.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-om-borettslaget';
const { side, utkast } = await client.fetch(`{ "side": *[_id == $id][0], "utkast": *[_id == "drafts." + $id]._id }`, { id: SIDE });
if (utkast.length) throw new Error('The page has an unpublished draft. Publish or discard it in the Studio first.');
const baand = side?.seksjoner?.find((s) => s._type === 'fargebaand' && s._key === 'omradet');
if (!baand) throw new Error('The «Området» band (fargebaand omradet) was not found on the page.');
if (baand.kart) { console.log('Nothing to do: the map is already on.'); process.exit(0); }
console.log(`${SIDE} / ${baand._key} («${baand.overtittel}»): kart ⇒ true`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-omradet-kart-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side], null, 2));
console.log(`\nBackup: ${backup}`);
await client.patch(SIDE).ifRevisionId(side._rev).set({ [`seksjoner[_key=="${baand._key}"].kart`]: true }).commit();
console.log(`Done. Undo: switch «Vis kart over området» off in the Studio.`);
