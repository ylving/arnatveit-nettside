// Front page as sections: the fixed fields `faktaseksjon` + `fakta` and `dokumentsenter` → `seksjoner`, in today's
// order (Å bo her → Aktuelt → I borettslaget nå → Praktisk info → Dokumentsenter-boks). The old fields are removed.
//   node --env-file=.env scripts/migrate/forside-seksjoner.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/forside-seksjoner.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const { forside, utkast } = await client.fetch(`{ "forside": *[_id == "forside"][0], "utkast": *[_id == "drafts.forside"]._id }`);
if (utkast.length) throw new Error('The front page has an unpublished draft. Publish or discard it in the Studio first.');
if (forside.seksjoner) { console.log('Nothing to do: the front page already has sections.'); process.exit(0); }

const { faktaseksjon = {}, fakta = [], dokumentsenter } = forside;
const seksjoner = [
  fakta.length && { ...faktaseksjon, fakta, _type: 'forsideFakta', _key: 'fakta' },
  { _type: 'forsideAktuelt', _key: 'aktuelt', tittel: 'Aktuelt' },
  { _type: 'forsideNaa', _key: 'naa', tittel: 'I borettslaget nå' },
  { _type: 'forsidePraktisk', _key: 'praktisk', tittel: 'Praktisk info' },
  dokumentsenter?.tittel && { ...dokumentsenter, _type: 'forsideDokumentsenter', _key: 'dokumentsenter' },
].filter(Boolean);

console.log('forside.seksjoner:');
seksjoner.forEach((s) => console.log(`  ${s._type.padEnd(24)} ${s.tittel ?? ''}${s.fakta ? ` (${s.fakta.length} faktakort)` : ''}${s.dokumenter ? ` (${s.dokumenter.length} snarveier)` : ''}`));
console.log('Removed: faktaseksjon, fakta, dokumentsenter');
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-forside-seksjoner-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([forside], null, 2));
console.log(`\nBackup: ${backup}`);
await client.patch('forside').ifRevisionId(forside._rev).set({ seksjoner }).unset(['faktaseksjon', 'fakta', 'dokumentsenter']).commit();
console.log(`Done. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
