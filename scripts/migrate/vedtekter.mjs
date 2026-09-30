// Vedtekter per the design: page heading «Vedtekter og regler», the design ingress, and the sections regelverk (cards)
// → nivaaer ("Hvordan henger reglene sammen?") → relatert, replacing the old text, document list and Lovdata link.
// The two documents (statutes, house rules) stay `dokument`s and get a description and "Sist endret" date.
//   node --env-file=.env scripts/migrate/vedtekter.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/vedtekter.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { DOKUMENTER, INGRESS, OVERSKRIFT, SEKSJONER } from './vedtekter-data.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-vedtekter';
const GAMLE = ['tk10', 'k13', 'tk15']; // the imported sections: text, document list, Lovdata link
const ids = Object.keys(DOKUMENTER);

const { side, dokumenter, sider, utkast } = await client.fetch(`{
  "side": *[_id == $side][0],
  "dokumenter": *[_id in $ids],
  "sider": *[_id in ["side-generalforsamling", "side-dokumentsenter"]]._id,
  "utkast": *[_id in path("drafts.**") && _id in ["drafts." + $side, ...$utkastIds]]._id
}`, { side: SIDE, ids, utkastIds: ids.map((id) => `drafts.${id}`) });
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);
if (!side) throw new Error(`${SIDE} not found`);
if (side.seksjoner?.some((s) => s._type === 'regelverk')) { console.log('Nothing to do: the page already has a Regelverk section (already migrated?).'); process.exit(0); }
const naa = (side.seksjoner ?? []).map((s) => s._key);
if (naa.join() !== GAMLE.join()) throw new Error(`The page's sections were edited since the import (${naa.join(', ')}); not overwriting. Check them in the Studio.`);
if (dokumenter.length !== ids.length) throw new Error(`Missing documents: ${ids.filter((id) => !dokumenter.some((d) => d._id === id)).join(', ')}`);
if (sider.length !== 2) throw new Error(`Relatert pages missing (found ${sider.join(', ')})`);

console.log(`${SIDE}\n  overskrift: ${side.overskrift ?? '–'} ⇒ ${OVERSKRIFT}\n  ingress: ${side.ingress}\n        ⇒  ${INGRESS}`);
console.log('  seksjoner:', side.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', SEKSJONER.map((s) => `${s._type}(${s._key})`).join(' → '));
for (const d of dokumenter) {
  const ny = DOKUMENTER[d._id];
  console.log(`${d._id} («${d.tittel}»)\n  dato: ${d.dato ?? '–'} ⇒ ${ny.dato}\n  beskrivelse: ${d.beskrivelse ?? '–'} ⇒ ${ny.beskrivelse}`);
}
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-vedtekter-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side, ...dokumenter], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
tx.patch(client.patch(SIDE).ifRevisionId(side._rev).set({ overskrift: OVERSKRIFT, ingress: INGRESS, seksjoner: SEKSJONER }));
for (const d of dokumenter) tx.patch(client.patch(d._id).ifRevisionId(d._rev).set(DOKUMENTER[d._id]));
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
