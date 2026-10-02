// Demo news items to fill out Aktuelt while the design is reviewed. All ids start with "demo-nyhet-", so they can be
// removed in one go. They're published directly (no drafts).
//   node --env-file=.env scripts/demo-nyheter.mjs --dry     show what would be created, write nothing
//   node --env-file=.env scripts/demo-nyheter.mjs           create (or overwrite) the demo items
//   node --env-file=.env scripts/demo-nyheter.mjs --slett   delete every demo-nyhet-* item (and drafts of them)
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });
const dry = process.argv.includes('--dry');

if (process.argv.includes('--slett')) {
  const ids = await client.fetch('*[_id match "demo-nyhet-*" || _id match "drafts.demo-nyhet-*"]._id');
  console.log(ids.length ? `Delete: ${ids.join(', ')}` : 'No demo items found.');
  if (!dry && ids.length) {
    const tx = client.transaction();
    for (const id of ids) tx.delete(id);
    await tx.commit();
    console.log('Deleted.');
  }
  process.exit(0);
}

let n = 0;
const key = () => `d${(n++).toString(36)}`;
const ref = (_ref) => ({ _type: 'reference', _ref });
const avsnitt = (...tekster) => tekster.map((t) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text: t, marks: [] }] }));
const overskrift = (t) => ({ _type: 'block', _key: key(), style: 'h2', markDefs: [], children: [{ _type: 'span', _key: key(), text: t, marks: [] }] });
const tekst = (...blokker) => ({ _type: 'tekst', _key: key(), innhold: blokker.flat() });
const relatert = (side, tittel, tekst) => ({ _type: 'relatert', _key: key(), lenker: [{ _type: 'relatertLenke', _key: key(), side: ref(side), ...(tittel && { tittel }), ...(tekst && { tekst }) }] });
const nyhet = (id, { tittel, dato, kategori, ingress, fakta, seksjoner, dokumenter }) => ({
  _id: `demo-nyhet-${id}`, _type: 'nyhet', tittel, slug: { _type: 'slug', current: `demo-${id}` }, dato,
  kategori: ref(`nyhetskategori-${kategori}`), ingress, ...(fakta && { fakta }), seksjoner,
  ...(dokumenter && { dokumenter: dokumenter.map((d) => ({ ...ref(d), _key: key() })) }),
});

const NYHETER = [
  nyhet('hostdugnad', {
    tittel: 'Velkommen til høstdugnad 10. oktober', dato: '2026-10-01', kategori: 'dugnad',
    ingress: 'Vi møtes ved ballplassen kl. 10. Raking, rydding av bed og klargjøring for vinteren, med kaffe og pølser etterpå.',
    fakta: { dato: '2026-10-10', sted: 'Ballplassen' },
    seksjoner: [
      tekst(avsnitt(
        'Høstdugnaden er den viktigste dugnaden i året. Vi raker løv, rydder bed og felles uteområder, og gjør lekeplassene klare for vinteren.',
        'Hvert tun får egne oppgaver. Tunkontaktene fordeler arbeidet når vi samles ved ballplassen.',
      ), overskrift('Ta med'), avsnitt('Arbeidshansker og gjerne egen rake. Hagesekker og trillebårer står klare.')),
      relatert('side-dugnad', 'Om dugnad i borettslaget', 'Timer, satser og dugnadsliste'),
    ],
  }),
  nyhet('styret-konstituert', {
    tittel: 'Det nye styret har konstituert seg', dato: '2026-06-18', kategori: 'styret',
    ingress: 'Se hvem som har hvilket ansvar etter generalforsamlingen, og hvem du kontakter for hva.',
    seksjoner: [
      tekst(avsnitt(
        'Etter generalforsamlingen i mai har det nye styret hatt sitt første møte og fordelt ansvarsområdene mellom seg.',
        'Har du spørsmål om bygging, utleie eller fellesarealer, finner du riktig person på styresiden.',
      )),
      relatert('side-styret', 'Styret', 'Hvem som har ansvar for hva'),
    ],
  }),
  nyhet('abc-mars', {
    tittel: 'ABC-nytt for mars er ute', dato: '2026-03-12', kategori: 'informasjon',
    ingress: 'Årets første utgave er delt ut i postkassene og ligger også på nettsiden.',
    seksjoner: [
      tekst(avsnitt('I denne utgaven: datoer for vårens dugnader, nytt fra styret og en påminnelse om regler for parkering i tunene.')),
      relatert('side-abc-nytt', 'Alle utgaver av ABC-nytt'),
    ],
  }),
  nyhet('varmepumper', {
    tittel: 'Påminnelse: søk før du monterer varmepumpe', dato: '2026-02-03', kategori: 'styret',
    ingress: 'Utvendige enheter endrer fasaden, og styret må godkjenne plassering og montering på forhånd.',
    seksjoner: [
      tekst(avsnitt(
        'Styret har fått flere spørsmål om varmepumper i vinter. Utedelen skal monteres slik at den ikke sjenerer naboene, og plasseringen må godkjennes før arbeidet starter.',
        'Søknadsskjema og veiledning finner du i dokumentsenteret.',
      )),
      relatert('side-dokumentsenter', 'Dokumentsenter', 'Søknad om varmepumpe og andre skjemaer'),
    ],
    dokumenter: ['dokument-dokumentsenter-soknad-varmepumpe'],
  }),
  nyhet('broyting', {
    tittel: 'Brøyting og strøing i vinter', dato: '2025-11-20', kategori: 'informasjon',
    ingress: 'Slik fungerer snørydding i tunene, og hva du selv må gjøre ved egen inngang.',
    seksjoner: [
      tekst(avsnitt(
        'Borettslaget brøyter og strør gangveiene i tunene og parkeringsanlegget. Ved store snøfall kan det ta litt tid før alle områder er ryddet.',
        'Hver andelseier rydder selv trapp og inngangsparti. Strøsand står i kassene ved hvert tun.',
      )),
    ],
  }),
  nyhet('vardugnad-takk', {
    tittel: 'Takk for innsatsen på vårdugnaden', dato: '2025-05-12', kategori: 'dugnad',
    ingress: 'Over 60 beboere møtte opp, og uteområdene er klare for sommeren.',
    fakta: { dato: '2025-05-10', sted: 'Alle tun' },
    seksjoner: [tekst(avsnitt('Bedene er luket, sandkassene har fått ny sand og benkene er beiset. Takk til alle som bidro, og til miljøutvalget for god organisering.'))],
  }),
];

const finnes = await client.fetch('{ "kategorier": *[_type == "nyhetskategori"]._id, "sider": *[_id in $s]._id, "dok": *[_id in $d]._id }', {
  s: ['side-dugnad', 'side-styret', 'side-abc-nytt', 'side-dokumentsenter'],
  d: ['dokument-dokumentsenter-soknad-varmepumpe'],
});
const mangler = [
  ...NYHETER.map((x) => x.kategori._ref).filter((id) => !finnes.kategorier.includes(id)),
  ...['side-dugnad', 'side-styret', 'side-abc-nytt', 'side-dokumentsenter'].filter((id) => !finnes.sider.includes(id)),
  ...(finnes.dok.length ? [] : ['dokument-dokumentsenter-soknad-varmepumpe']),
];
if (mangler.length) throw new Error(`Referenced documents missing: ${[...new Set(mangler)].join(', ')}`);

for (const x of NYHETER) console.log(`${x._id.padEnd(32)} ${x.dato}  ${x.kategori._ref.replace('nyhetskategori-', '').padEnd(12)} ${x.tittel}`);
if (dry) { console.log('\nDry run, nothing written.'); process.exit(0); }
const tx = client.transaction();
for (const x of NYHETER) tx.createOrReplace(x);
await tx.commit();
console.log(`\nCreated ${NYHETER.length} demo items. Press «Oppdater nettsiden» to see them. Remove later: node --env-file=.env scripts/demo-nyheter.mjs --slett`);
