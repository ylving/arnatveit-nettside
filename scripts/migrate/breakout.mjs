// New section width "Breakout" (960px, between text and wide). Sections whose component used to cap itself at 960px
// inside "Bred" get it explicitly, so nothing moves: Hva skjer, Nøkkeltall, Alle dokumenter and the tun member list.
//   node --env-file=.env scripts/migrate/breakout.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/breakout.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const var960 = (s) => ['arrangementer', 'nokkeltall', 'dokumentsok'].includes(s._type) || (s._type === 'medlemsliste' && s.visning === 'tun');
const sider = await client.fetch('*[_type == "side"]');
const utkast = sider.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished page drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them first.`);

const endringer = sider.flatMap((side) =>
  (side.seksjoner ?? []).filter((s) => var960(s) && s.bredde !== 'breakout' && (s.bredde ?? 'bred') === 'bred').map((s) => ({ side, s })),
);
if (!endringer.length) { console.log('Nothing to do.'); process.exit(0); }
for (const { side, s } of endringer) console.log(`${side._id} / ${s._key} (${s._type}${s.visning ? `, ${s.visning}` : ''}): bredde ${s.bredde ?? '(default)'} ⇒ breakout`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const berørte = [...new Map(endringer.map(({ side }) => [side._id, side])).values()];
const backup = `scripts/migrate/cache/backup-breakout-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(berørte, null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const side of berørte) {
  const set = Object.fromEntries(endringer.filter((e) => e.side === side).map(({ s }) => [`seksjoner[_key=="${s._key}"].bredde`, 'breakout']));
  tx.patch(client.patch(side._id).ifRevisionId(side._rev).set(set));
}
const res = await tx.commit();
console.log(`Updated ${res.results.length} pages.`);
