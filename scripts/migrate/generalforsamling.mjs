// Generalforsamling per the design: every protocol (a `dokument` in category Protokoller) becomes a
// `generalforsamling` (date, ordinary/extraordinary, the same PDF asset, old addresses kept); the old documents and
// the category are deleted. The banner links to the newest protocol automatically; the 2026 news item's attachment
// points to the new document. Page: design ingress and sections punkter → oppfordring → generalforsamlinger →
// the existing Årsberetninger list (not in the design, kept; decided without asking, see HANDOFF.md).
//   node --env-file=.env scripts/migrate/generalforsamling.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/generalforsamling.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { INGRESS, SEKSJONER, tilGeneralforsamling } from './generalforsamling-data.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-generalforsamling';
const KATEGORI = 'kategori-protokoller';
const NYHET = 'nyhet-generalforsamling-2026';

const { side, innst, nyhet, protokoller, utkast, finnes } = await client.fetch(`{
  "side": *[_id == $side][0], "innst": *[_id == "innstillinger"][0], "nyhet": *[_id == $nyhet][0],
  "protokoller": *[_type == "dokument" && kategori._ref == $kategori] | order(dato desc),
  "utkast": *[_id in path("drafts.**") && (_id in ["drafts." + $side, "drafts.innstillinger", "drafts." + $nyhet] || _type in ["dokument", "generalforsamling"])]._id,
  "finnes": count(*[_type == "generalforsamling"])
}`, { side: SIDE, kategori: KATEGORI, nyhet: NYHET });
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.join(', ')}). Publish or discard them in the Studio first.`);
if (finnes) { console.log(`Nothing to do: ${finnes} general assemblies already exist (already migrated?).`); process.exit(0); }
const refererte = await client.fetch('*[references($ids) && !(_id in ["innstillinger", $nyhet])]._id', { ids: protokoller.map((d) => d._id), nyhet: NYHET });
if (refererte.length) throw new Error(`Other documents link to protocols (${refererte.join(', ')}); relink them first.`);

const nye = protokoller.map((d) => ({ ...tilGeneralforsamling(d), protokoll: { _type: 'file', asset: d.fil.asset }, fra: d }));
if (new Set(nye.map((n) => n._id)).size !== nye.length) throw new Error('Two assemblies of the same type in one year');
const nyId = Object.fromEntries(nye.map((n) => [n.fra._id, n._id]));

const arsberetninger = side.seksjoner.find((s) => s._type === 'dokumentliste' && s.kategori?._ref === 'kategori-arsberetninger');
if (!arsberetninger) throw new Error('The Årsberetninger list is missing on the page; not touching it.');
const seksjoner = [...SEKSJONER, arsberetninger];
const banner = { ...innst.banner, sisteProtokoll: true, lenke: { _type: 'lenke', tekst: innst.banner?.lenke?.tekst || 'Les protokollen' } };
const vedlegg = (nyhet.dokumenter ?? []).map((r) => (nyId[r._ref] ? { ...r, _ref: nyId[r._ref] } : r));

console.log(`${nye.length} protocols → generalforsamling:`);
for (const n of nye) console.log(`  ${n.fra.tittel.padEnd(38)} ${n.dato} ⇒ ${n._id} (${n.type}${n.sted ? `, ${n.sted}` : ''})`);
console.log(`delete ${protokoller.length} documents and ${KATEGORI}`);
console.log(`${SIDE}\n  ingress: ${side.ingress}\n        ⇒  ${INGRESS}`);
console.log('  seksjoner:', side.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '));
console.log(`innstillinger.banner: link ${innst.banner?.lenke?.intern?._ref ?? innst.banner?.lenke?.url} ⇒ newest protocol automatically («${banner.lenke.tekst}»)`);
console.log(`${NYHET}.dokumenter: ${(nyhet.dokumenter ?? []).map((r) => r._ref).join(', ')} ⇒ ${vedlegg.map((r) => r._ref).join(', ')}`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-generalforsamling-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side, innst, nyhet, await client.getDocument(KATEGORI), ...protokoller], null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const { fra, ...n } of nye) tx.create(n);
tx.patch(client.patch(SIDE).ifRevisionId(side._rev).set({ ingress: INGRESS, seksjoner }));
tx.patch(client.patch('innstillinger').ifRevisionId(innst._rev).set({ banner }));
tx.patch(client.patch(NYHET).ifRevisionId(nyhet._rev).set({ dokumenter: vedlegg }));
for (const d of protokoller) tx.delete(d._id);
tx.delete(KATEGORI);
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}, then delete the gf-* documents.`);
