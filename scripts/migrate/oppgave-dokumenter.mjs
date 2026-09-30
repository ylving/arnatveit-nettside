// Task steps can have several documents: `oppgave.steg[].dokument` (one reference) → `dokumenter` (a list).
//   node --env-file=.env scripts/migrate/oppgave-dokumenter.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/oppgave-dokumenter.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const oppgaver = await client.fetch('*[_type == "oppgave"]');
const utkast = oppgaver.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them in the Studio first.`);
const endres = oppgaver.filter((o) => o.steg?.some((s) => s.dokument));
if (!endres.length) { console.log('Nothing to do: no step has the old `dokument` field.'); process.exit(0); }

const nye = endres.map((o) => ({
  o,
  steg: o.steg.map(({ dokument, ...s }) => (dokument ? { ...s, dokumenter: [...(s.dokumenter ?? []), { ...dokument, _key: dokument._ref.slice(-12) }] } : s)),
}));
for (const { o, steg } of nye) console.log(`${o._id}: ${steg.filter((s) => s.dokumenter).map((s) => `${s._key} → [${s.dokumenter.map((d) => d._ref).join(', ')}]`).join(' · ')}`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-oppgave-dokumenter-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(endres, null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const { o, steg } of nye) tx.patch(client.patch(o._id).ifRevisionId(o._rev).set({ steg }));
const res = await tx.commit();
console.log(`Updated ${res.results.length} tasks.`);
