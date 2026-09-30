// Dokumentsenter per the design: "Søknader og skjema" is split into Søknader, Bygging and Skjemaer; the four
// categories get a colour, icon and intro line; documents get the design's titles, descriptions, tun tags and order;
// four "Jeg vil …" tasks are created; the page gets the new ingress and the sections `oppgaver` → `dokumentsok`.
// "HMS-sjekkliste til beboere" (not in the design) moves to HMS and is kept (decided 2026-09-30).
//   node --env-file=.env scripts/migrate/dokumentsenter.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/dokumentsenter.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';
import { DOKUMENTER, INGRESS, KATEGORIER, oppgaver, seksjoner as lagSeksjoner } from './dokumentsenter-data.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-dokumentsenter';
const GAMMEL = 'kategori-soknader-og-skjema';
const ref = (_ref, _key) => ({ _type: 'reference', _ref, ...(_key && { _key }) });

const docs = await client.fetch(
  `*[_id in [$side, "drafts." + $side] || (_type == "dokument" && kategori._ref in ["kategori-hms", $gammel]) || (_type == "dokument" && _id in path("drafts.**"))
     || _id in ["kategori-hms", $gammel] || _type == "oppgave"]`,
  { side: SIDE, gammel: GAMMEL },
);
const utkast = docs.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them in the Studio first.`);
if (docs.some((d) => d._type === 'oppgave')) { console.log('Nothing to do: tasks already exist (already migrated?).'); process.exit(0); }
const side = docs.find((d) => d._id === SIDE);
const hms = docs.find((d) => d._id === 'kategori-hms');
const gammel = docs.find((d) => d._id === GAMMEL);
if (!side || !hms || !gammel) throw new Error('Page or categories missing; not touching anything.');

// Resolve every document by its current title; abort if one is missing or ambiguous
const dokumenter = docs.filter((d) => d._type === 'dokument');
const idFor = {};
const patcher = [];
for (const [kategori, rader] of Object.entries(DOKUMENTER)) {
  rader.forEach(([tittel, nyTittel, beskrivelse, tun], i) => {
    const treff = dokumenter.filter((d) => d.tittel === tittel);
    if (treff.length !== 1) throw new Error(`Expected one document titled "${tittel}", found ${treff.length}`);
    const d = treff[0];
    idFor[tittel] = d._id;
    const set = { kategori: ref(kategori), rekkefolge: i + 1, ...(nyTittel && { tittel: nyTittel }), ...(beskrivelse && { beskrivelse }), ...(tun && { tun }) };
    patcher.push({ d, set });
  });
}
const ukjente = dokumenter.filter((d) => !Object.values(idFor).includes(d._id));
if (ukjente.length) throw new Error(`Documents not in the mapping: ${ukjente.map((d) => d.tittel).join(', ')}`);

const OPPGAVER = oppgaver((tittel) => idFor[tittel]);
const seksjoner = lagSeksjoner(OPPGAVER.map((o) => o._id));

console.log('Categories:');
for (const k of KATEGORIER) console.log(`  ${k._id === 'kategori-hms' ? 'patch ' : 'create'} ${k._id}: ${k.tittel} · ${k.farge} · ${k.ikon} · «${k.ingress}»`);
console.log(`  delete ${GAMMEL} (${gammel.tittel})`);
console.log('Documents:');
for (const { d, set } of patcher) console.log(`  ${d.tittel}\n    ⇒ ${set.kategori._ref.replace('kategori-', '')} #${set.rekkefolge}${set.tittel ? ` · «${set.tittel}»` : ''}${set.tun ? ` · ${set.tun}` : ''}${set.beskrivelse ? ` · ${set.beskrivelse}` : ''}`);
console.log('Tasks:', OPPGAVER.map((o) => `${o.tittel} (${o.steg.length} steg)`).join(' · '));
console.log(`${SIDE}\n  ingress: ${side.ingress}\n        ⇒  ${INGRESS}`);
console.log('  seksjoner:', side.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '));
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-dokumentsenter-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify(docs, null, 2));
console.log(`\nBackup: ${backup}`);
const tx = client.transaction();
for (const { _id, tittel, slug, ingress, farge, ikon } of KATEGORIER) {
  const felter = { tittel, slug: { _type: 'slug', current: slug }, ingress, farge, ikon, sortering: 'rekkefolge' };
  if (_id === 'kategori-hms') tx.patch(client.patch(_id).ifRevisionId(hms._rev).set(felter));
  else tx.create({ _id, _type: 'dokumentkategori', ...felter });
}
for (const { d, set } of patcher) tx.patch(client.patch(d._id).ifRevisionId(d._rev).set(set));
for (const o of OPPGAVER) tx.create(o);
tx.patch(client.patch(SIDE).ifRevisionId(side._rev).set({ ingress: INGRESS, seksjoner }));
tx.delete(GAMMEL);
const res = await tx.commit();
console.log(`Done: ${res.results.length} changes.`);
