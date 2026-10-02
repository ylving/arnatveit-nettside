// Four news items from the board (2026), entered as given: the first sentence is the lead (required), the rest the
// body. Created only if they don't exist yet (createIfNotExists), so later edits in the Studio are never overwritten.
//   node --env-file=.env scripts/nyheter-2026.mjs --dry   show what would be created, write nothing
//   node --env-file=.env scripts/nyheter-2026.mjs         create them
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

let n = 0;
const key = () => `n${(n++).toString(36)}`;
const ref = (_ref) => ({ _type: 'reference', _ref });
// A paragraph; [text, pageId] parts become internal links
const avsnitt = (...deler) => {
  const markDefs = [];
  const children = deler.map((d) => {
    if (typeof d === 'string') return { _type: 'span', _key: key(), text: d, marks: [] };
    const k = key();
    markDefs.push({ _type: 'link', _key: k, intern: ref(d[1]) });
    return { _type: 'span', _key: key(), text: d[0], marks: [k] };
  });
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children };
};
const tekst = (...blokker) => ({ _type: 'tekst', _key: key(), innhold: blokker });
const nyhet = (id, tittel, dato, kategori, ingress, ...blokker) => ({
  _id: `nyhet-${dato}-${id}`, _type: 'nyhet', tittel, slug: { _type: 'slug', current: id }, dato,
  kategori: ref(`nyhetskategori-${kategori}`), ingress, seksjoner: [tekst(...blokker)],
});

const NYHETER = [
  nyhet('dugnad', 'Dugnad', '2026-06-21', 'dugnad',
    'Vi får innimellom spørsmål om dugnad i borettslaget.',
    avsnitt(
      'Om noen ønsker å gjøre dugnad på eget initiativ, så er det fritt frem for det. Det er også mulig å sende en henvendelse til styret for å få oppgaver som kan gjennomføres, om noen får ånden over seg Dugnad som gjøres gjennom året må føres av hver enkelt. BOB åpner for registrering av dugnadstimer ca 20 okt til 20 nov. Utenom dette er det ikke mulig å registrere timer til utbetaling. Det ligger liste som kan brukes til å føre fortløpende i ',
      ['dokumentarkivet', 'side-dokumentsenter'],
      ' på vår hjemmeside www.arnatveit-borettslag.no. Her finner man også annen nyttig informasjon',
    ),
  ),
  nyhet('vedlikeholdsprosjekt-og-asfaltering', 'Vedlikeholdsprosjekt og asfaltering', '2026-08-28', 'styret',
    'Mandag 24. august hadde vi befaring av asfaltområdene i A-tun.',
    avsnitt('Nå jobber vi for å få prosjektet i gang så snart som mulig, og vi deler mer informasjon når oppstarten er avklart.'),
    avsnitt('Vi planlegger også et møte med entreprenøren som skal utføre arbeidet med dører og vinduer. Når dato og videre fremdrift er avklart, går vi i gang. Beboere som ennå ikke har fått befaring, vil bli kontaktet snart.'),
    avsnitt('Mvh styret'),
    avsnitt('Den nye muren i A-tunet skal sikres på grunn av høyden. Arbeidet er litt forsinket fordi vi venter på levering, men planen er at det blir utført i begynnelsen av september.'),
  ),
  nyhet('bilkjoring-i-a-tun', 'Bilkjøring i A-tun', '2026-03-15', 'styret',
    'Styret har fått melding om parkering over lengre tid i A-tun, også over natt, dokumentert med bilder.',
    avsnitt('Vi må minne om at A-tun er bilfritt. Det er åpnet for innkjøring ved av- og pålessing, men ikke parkering utover dette. En av styrets viktigste oppgaver er å håndheve borettslagets vedtekter, herunder ferdsel med bil i A-tun. Vi har de siste årene hatt avtale med Vestpark for kontroll, men det forekommer fremdeles parkering over lengre tid. Her må styret vurdere hvilke tiltak vi kan bruke for å håndheve vedtektene, og da er kameraløsning med skiltgjenkjenning kommet på banen. Styret håper at situasjonen løser seg selv, men vil følge med å vurdere tiltak på de neste styremøtene.'),
  ),
  nyhet('boss', 'Boss', '2026-03-12', 'informasjon',
    'Vi får jevnlig tilbakemeldinger om feil sortering i containerne.',
    avsnitt('Korrekt avfallshåndtering er viktig for å unngå ekstra kostnader for borettslaget. Husk også å brette papp før den kastes for å sikre god plass og redusere risiko for overfylte containere.'),
  ),
];

// Everything referenced must exist, and no other news item may already use the address
const sjekk = await client.fetch(`{
  "kategorier": *[_type == "nyhetskategori"]._id,
  "side": defined(*[_id == "side-dokumentsenter"][0]),
  "slugger": *[_type == "nyhet" && slug.current in $s]{ _id, "s": slug.current }
}`, { s: NYHETER.map((x) => x.slug.current) });
const mangler = NYHETER.map((x) => x.kategori._ref).filter((id) => !sjekk.kategorier.includes(id));
if (mangler.length) throw new Error(`Categories missing: ${[...new Set(mangler)].join(', ')}`);
if (!sjekk.side) throw new Error('side-dokumentsenter missing');
const kollisjon = sjekk.slugger.filter((x) => !NYHETER.some((y) => y._id === x._id));
if (kollisjon.length) throw new Error(`Address already used by another news item: ${kollisjon.map((x) => `/aktuelt/${x.s} (${x._id})`).join(', ')}`);

for (const x of NYHETER) console.log(`${x.dato}  ${x.kategori._ref.replace('nyhetskategori-', '').padEnd(12)} /aktuelt/${x.slug.current.padEnd(38)} ${x.tittel}`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }
const tx = client.transaction();
for (const x of NYHETER) tx.createIfNotExists(x);
await tx.commit();
console.log(`\nDone (existing items left untouched). Press «Oppdater nettsiden» to publish them on the site.`);
