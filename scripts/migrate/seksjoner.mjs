// Migrate pages from `innhold` (one rich text field) to `seksjoner` (page builder).
//   node --env-file=.env scripts/migrate/seksjoner.mjs --dry              show the result, write nothing
//   node --env-file=.env scripts/migrate/seksjoner.mjs                    back up, then migrate (published + drafts)
//   node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett F    restore pages from backup file F
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { tilSeksjoner, oversikt } from './seksjoner-lib.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const args = process.argv.slice(2);
const gjenopprett = args.includes('--gjenopprett') ? args[args.indexOf('--gjenopprett') + 1] : null;

if (gjenopprett) {
  const docs = JSON.parse(fs.readFileSync(gjenopprett, 'utf8'));
  const tx = client.transaction();
  for (const { _rev, _updatedAt, _createdAt, ...d } of docs) tx.createOrReplace(d);
  await tx.commit();
  console.log(`Restored ${docs.length} documents from ${gjenopprett}`);
  process.exit(0);
}

// Pages that still have `innhold` (published and drafts); harBarn uses the published id
const sider = await client.fetch(`*[_type == "side" && defined(innhold)]{
  ..., "harBarn": count(*[_type == "side" && forelder._ref == string::split(^._id, "drafts.")[-1]]) > 0
} | order(_id)`);
if (!sider.length) { console.log('Nothing to migrate: no page has `innhold`.'); process.exit(0); }

const plan = sider.map(({ harBarn, ...doc }) => ({ doc, seksjoner: tilSeksjoner(doc.innhold, harBarn) }));
for (const { doc, seksjoner } of plan) console.log(doc._id.padEnd(32), oversikt(seksjoner));

if (args.includes('--dry')) { console.log(`\nDry run: ${plan.length} pages, nothing written.`); process.exit(0); }

const backup = `scripts/migrate/cache/backup-for-seksjoner-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(plan.map((p) => p.doc), null, 2));
console.log(`\nBackup: ${backup}`);

const tx = client.transaction();
for (const { doc, seksjoner } of plan) tx.patch(client.patch(doc._id).ifRevisionId(doc._rev).set({ seksjoner }).unset(['innhold']));
const res = await tx.commit();
console.log(`Migrated ${res.results.length} pages. Undo with: node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
