// "Om oss og kontakt": Om borettslaget and Kontakt become one page (/om-borettslaget) per the design.
// - New singleton `omBorettslaget` with the contact details from Innstillinger (removed there) and the facts from the
//   page's fact list; the contact person stays the member toggled under Styre og utvalg.
// - side-om-borettslaget: design ingress, jump links, sections kontaktinfo (#kontakt) → fargebaand (#omradet) →
//   borettslagsfakta (#fakta); old addresses of the Kontakt page redirect to /om-borettslaget#kontakt.
// - side-kontakt deleted; menu: "Om borettslaget" → "Om oss og kontakt", "Kontakt" removed.
//   node --env-file=.env scripts/migrate/om-borettslaget.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/om-borettslaget.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const OM = 'side-om-borettslaget';
const KONTAKT = 'side-kontakt';
const ids = ['innstillinger', OM, KONTAKT, 'omBorettslaget'];
const docs = await client.fetch('*[_id in $alle]', { alle: [...ids, ...ids.map((id) => `drafts.${id}`)] });
const utkast = docs.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them in the Studio first.`);
if (docs.some((d) => d._id === 'omBorettslaget')) { console.log('Nothing to do: omBorettslaget exists (already migrated?).'); process.exit(0); }
const innst = docs.find((d) => d._id === 'innstillinger');
const om = docs.find((d) => d._id === OM);
const kontaktside = docs.find((d) => d._id === KONTAKT);
if (!innst?.kontakt || !om || !kontaktside) throw new Error('Innstillinger.kontakt or one of the pages is missing; not touching anything.');
const referanser = await client.fetch('*[references($id) && _id != "innstillinger"]._id', { id: KONTAKT });
if (referanser.length) throw new Error(`Other documents link to the Kontakt page (${referanser.join(', ')}); relink them first.`);

// Facts from the page's fact list, by label
const rader = Object.fromEntries((om.seksjoner.find((s) => s._type === 'faktaliste')?.rader ?? []).map((r) => [r.etikett, r.verdi]));
const krev = (etikett) => { if (!rader[etikett]) throw new Error(`Fact "${etikett}" missing on the page`); return rader[etikett]; };
const [dag, mnd, aar] = krev('Stiftelsesdato').split('.');
const k = innst.kontakt;
const singleton = {
  _id: 'omBorettslaget', _type: 'omBorettslaget',
  epost: k.epost,
  styreNotat: 'Saker du ønsker at styret skal behandle, må sendes skriftlig minst én uke før oppsatt styremøte.',
  besoksadresse: k.besoksadresse.replace(/(\d)-(\d)/, '$1–$2'),
  kartlenke: k.kartlenke,
  postadresse: k.postadresse,
  postNotat: 'Post til styret går via forretningsfører.',
  fakturaadresse: k.fakturaadresse.replace(/^org\.nr\.:\s*(\d{3})(\d{3})(\d{3})$/m, 'Org.nr. $1 $2 $3'),
  fakturaNotat: 'For leverandører.',
  fakturaEpost: k.fakturaEpost,
  juridiskNavn: krev('Juridisk navn'),
  orgnr: krev('Organisasjonsnummer'),
  selskapsform: krev('Selskapsform'),
  forretningsforer: krev('Forretningsfører'),
  revisor: krev('Revisor'),
  stiftet: `${aar}-${mnd}-${dag}`,
  andeler: Number(krev('Antall andeler')),
  tun: 3,
};

const ref = (_ref) => ({ _type: 'reference', _ref });
const avsnitt = (_key, text) => ({ _type: 'block', _key, style: 'normal', markDefs: [], children: [{ _type: 'span', _key: `${_key}s`, text, marks: [] }] });
const INGRESS = 'Arnatveit Borettslag består av rekkehus fordelt på tre tun i Arna, Bergen. Her finner du kontaktinformasjon, adresser og fakta om borettslaget.';
const seksjoner = [
  {
    _type: 'kontaktinfo', _key: 'kontakt', tittel: 'Kontakt', visKart: true, bredde: 'bred',
    lenker: [
      { _type: 'kontaktlenke', _key: 'styret', tittel: 'Hvem kontakter jeg?', tekst: 'Se hele styret, og hvem som har ansvar for hva', side: ref('side-styret') },
      { _type: 'kontaktlenke', _key: 'dokumenter', tittel: 'Leter du etter et skjema?', tekst: 'Søknader, veiledninger og sjekklister', side: ref('side-dokumentsenter') },
    ],
  },
  {
    _type: 'fargebaand', _key: 'omradet', overtittel: 'Området', tittel: 'Grønt, rolig og kort vei til alt',
    tekst: [
      avsnitt('o1', 'Borettslaget har gode og romslige fellesarealer, med lekeplass i hvert tun og egen ballplass. Ett av tunene er bilfritt med felles parkeringsanlegg; de to andre har parkering ved husene.'),
      avsnitt('o2', 'Området har nær tilgang til et rikholdig tur- og friluftsområde, og det er gangavstand til barneskole, buss og butikk. Det er kort vei til Øyrane Torg og togstasjonen, med tog til Bergen sentrum hver halvtime.'),
    ],
  },
  { _type: 'borettslagsfakta', _key: 'fakta', tittel: 'Fakta', ingress: 'Offisielle opplysninger om borettslaget, blant annet til bruk ved kjøp og salg.', bredde: 'bred' },
];
// The Kontakt page's addresses (its own and its old ones) now go to the contact section
const gamleUrler = [...new Set([...(om.gamleUrler ?? []), ...['/kontakt', ...(kontaktside.gamleUrler ?? [])].map((u) => `${u}#kontakt`)])];

const hovedmeny = innst.hovedmeny
  .filter((l) => l.intern?._ref !== KONTAKT)
  .map((l) => (l.intern?._ref === OM ? { ...l, tekst: 'Om oss og kontakt' } : l));

console.log('omBorettslaget (new):');
for (const [f, v] of Object.entries(singleton)) if (!f.startsWith('_')) console.log(`  ${f}: ${String(v).replace(/\n/g, ' / ')}`);
console.log(`${OM}\n  ingress: ${om.ingress}\n        ⇒  ${INGRESS}\n  snarveier: true`);
console.log('  seksjoner:', om.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '));
console.log(`  gamleUrler: ${JSON.stringify(om.gamleUrler ?? [])} ⇒ ${JSON.stringify(gamleUrler)}`);
console.log(`delete ${KONTAKT} (seksjoner: ${kontaktside.seksjoner.map((s) => s._type).join(' → ')})`);
console.log(`innstillinger\n  hovedmeny: ${innst.hovedmeny.map((l) => l.tekst).join(' · ')}\n        ⇒  ${hovedmeny.map((l) => l.tekst).join(' · ')}\n  unset kontakt`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-om-borettslaget-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([innst, om, kontaktside], null, 2));
console.log(`\nBackup: ${backup}`);
const res = await client.transaction()
  .create(singleton)
  .patch(client.patch(OM).ifRevisionId(om._rev).set({ ingress: INGRESS, snarveier: true, seksjoner, gamleUrler }))
  .patch(client.patch('innstillinger').ifRevisionId(innst._rev).set({ hovedmeny }).unset(['kontakt']))
  .delete(KONTAKT)
  .commit();
console.log(`Done: ${res.results.length} changes. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}, then delete omBorettslaget.`);
