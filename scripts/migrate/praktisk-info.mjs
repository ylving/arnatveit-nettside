// Praktisk info per the design: the six cards (which repeated the front page) become grouped link rows with live
// details, followed by «Vanlige spørsmål» (six vanligSporsmal documents, created here) and a closing call to action.
//   node --env-file=.env scripts/migrate/praktisk-info.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/praktisk-info.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { SEKSJONER, SPORSMAL } from './praktisk-data.mjs';
import { oversikt } from './seksjoner-lib.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-praktisk-info';
const mal = [...new Set(SPORSMAL.map((s) => s.lenke.intern._ref))];
const sider = SEKSJONER[0].grupper.flatMap((g) => g.sider.map((s) => s.side._ref));
const { side, utkast, finnes, mangler } = await client.fetch(`{
  "side": *[_id == $side][0],
  "utkast": *[_id == "drafts." + $side]._id,
  "finnes": *[_type == "vanligSporsmal"]._id,
  "mangler": $ids[!(@ in *[_id in $ids]._id)]
}`, { side: SIDE, ids: [...mal, ...sider, 'side-dokumentsenter'] });
if (utkast.length) throw new Error('Praktisk info has an unpublished draft. Publish or discard it in the Studio first.');
if (mangler.length) throw new Error(`Referenced documents missing: ${mangler.join(', ')}`);
if (side.seksjoner?.some((s) => s._type === 'sporsmal')) { console.log('Nothing to do (already migrated?).'); process.exit(0); }
if (side.seksjoner?.some((s) => s._type !== 'undersider')) throw new Error(`The page has other sections than the cards (${oversikt(side.seksjoner)}); not overwriting.`);

const nye = SPORSMAL.filter((s) => !finnes.includes(s._id));
for (const s of SPORSMAL) console.log(`${finnes.includes(s._id) ? 'exists ' : 'create '} ${s._id}: ${s.sporsmal} → «${s.lenke.tekst}» (${s.lenke.intern._ref})`);
console.log(`${SIDE}\n  seksjoner: ${oversikt(side.seksjoner)} ⇒ ${oversikt(SEKSJONER)}`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-praktisk-info-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const s of nye) tx.createIfNotExists(s);
tx.patch(client.patch(SIDE).ifRevisionId(side._rev).set({ seksjoner: SEKSJONER }));
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}, then delete the sporsmal-* documents.`);
