// Årsberetninger on Generalforsamling as a timeline like Protokoller: the list gets "Vis som tidslinje etter år"
// (grupperEtterAar) and width "Bred".
//   node --env-file=.env scripts/migrate/arsberetninger.mjs --dry   show the change, write nothing
//   node --env-file=.env scripts/migrate/arsberetninger.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-generalforsamling';
const docs = await client.fetch('*[_id in [$id, "drafts." + $id]]', { id: SIDE });
if (docs.some((d) => d._id.startsWith('drafts.'))) throw new Error(`${SIDE} has an unpublished draft. Publish or discard it in the Studio first.`);
const side = docs[0];
const liste = side.seksjoner.find((s) => s._type === 'dokumentliste' && s.kategori?._ref === 'kategori-arsberetninger');
if (!liste) throw new Error('No Årsberetninger list on the page; not touching it.');
if (liste.grupperEtterAar && liste.bredde === 'bred') { console.log('Nothing to do: already a timeline.'); process.exit(0); }

console.log(`${SIDE} / ${liste._key} (${liste.tittel}): grupperEtterAar ${liste.grupperEtterAar} ⇒ true, bredde ${liste.bredde ?? '(default)'} ⇒ bred`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-arsberetninger-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side], null, 2));
console.log(`Backup: ${backup}`);
await client.patch(SIDE).ifRevisionId(side._rev).set({ [`seksjoner[_key=="${liste._key}"].grupperEtterAar`]: true, [`seksjoner[_key=="${liste._key}"].bredde`]: 'bred' }).commit();
console.log('Done.');
