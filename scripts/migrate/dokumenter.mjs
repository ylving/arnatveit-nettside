// One document section type: `dokumentliste` (kategori, grupperEtterAar) and `dokumentsok` (kategorier) become
// `dokumentliste` with `kategorier` and `visning` (liste / tidslinje / sok). Title, width and _key are kept.
//   node --env-file=.env scripts/migrate/dokumenter.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/dokumenter.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const gammel = (s) => s._type === 'dokumentsok' || (s._type === 'dokumentliste' && !s.kategorier);
const sider = await client.fetch('*[defined(seksjoner) && count(seksjoner[_type == "dokumentsok" || (_type == "dokumentliste" && !defined(kategorier))]) > 0]');
const utkast = sider.filter((s) => s._id.startsWith('drafts.')).map((s) => s._id);
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);
if (!sider.length) { console.log('Nothing to do: no old document sections (already migrated?).'); process.exit(0); }

const ny = (s) => {
  if (!gammel(s)) return s;
  const { kategori, grupperEtterAar, ...rest } = s;
  const kategorier = s._type === 'dokumentsok' ? s.kategorier : [{ ...kategori, _key: kategori._ref.replace(/^kategori-/, '') }];
  return { ...rest, _type: 'dokumentliste', kategorier, visning: s._type === 'dokumentsok' ? 'sok' : grupperEtterAar ? 'tidslinje' : 'liste' };
};

for (const side of sider) {
  console.log(side._id);
  for (const s of side.seksjoner.filter(gammel)) {
    const n = ny(s);
    console.log(`  ${s._type}(${s._key}) «${s.tittel ?? ''}» ${s.kategori?._ref ?? (s.kategorier ?? []).map((k) => k._ref).join(', ')}${s.grupperEtterAar ? ', tidslinje' : ''}`);
    console.log(`    ⇒ dokumentliste visning ${n.visning}, kategorier ${n.kategorier.map((k) => k._ref).join(', ')}, bredde ${n.bredde ?? '(default)'}`);
  }
}
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-dokumenter-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(sider, null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const side of sider) tx.patch(client.patch(side._id).ifRevisionId(side._rev).set({ seksjoner: side.seksjoner.map(ny) }));
const res = await tx.commit();
console.log(`Done: ${res.results.length} pages. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
