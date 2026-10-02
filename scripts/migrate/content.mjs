// Hand-curated content from the old site (verbatim text, obvious typos fixed — see docs/MIGRATION.md).
// Everything uses deterministic _ids so the import can be re-run safely.
import { tilSeksjoner } from './seksjoner-lib.mjs';
import * as dokumentsenter from './dokumentsenter-data.mjs';
import * as generalforsamling from './generalforsamling-data.mjs';
import * as vedtekter from './vedtekter-data.mjs';
import * as aktuelt from './aktuelt-data.mjs';
import * as praktisk from './praktisk-data.mjs';

let n = 0;
const key = () => `k${(n++).toString(36)}`;
const ref = (id) => ({ _type: 'reference', _ref: id });
const keyedRef = (id) => ({ ...ref(id), _key: key() });
const slug = (current) => ({ _type: 'slug', current });

// Portable Text helpers. Children: strings, or [text, href] for links (href may be an internal doc id prefixed "#").
function block(style, ...children) {
  const markDefs = [];
  const spans = children.map((c) => {
    if (typeof c === 'string') return { _type: 'span', _key: key(), text: c, marks: [] };
    const [text, href] = c;
    const def = { _type: 'link', _key: key() };
    if (href.startsWith('#')) def.intern = ref(href.slice(1));
    else def.href = href;
    markDefs.push(def);
    return { _type: 'span', _key: key(), text, marks: [def._key] };
  });
  return { _type: 'block', _key: key(), style, markDefs, children: spans };
}
const p = (...c) => block('normal', ...c);
const h2 = (t) => block('h2', t);
const h3 = (t) => block('h3', t);
const dokumentliste = (kategori, tittel, visning = 'liste') => ({ _type: 'dokumentliste', _key: key(), tittel, kategorier: [{ ...ref(`kategori-${kategori}`), _key: kategori }], visning });
const medlemsliste = (id) => ({ _type: 'medlemsliste', _key: key(), utvalg: ref(`utvalg-${id}`) });
const lenke = (tekst, target) => ({ _type: 'lenke', tekst, ...(target.startsWith('#') ? { intern: ref(target.slice(1)) } : { url: target }) });
const nokkeltall = (tittel, tall) => ({ _type: 'nokkeltall', _key: key(), tittel, bredde: 'breakout', tall: tall.map(([verdi, tekst]) => ({ _type: 'tallrad', _key: key(), verdi, tekst })) });
const hvaSkjer = (kategori) => ({ _type: 'arrangementer', _key: key(), tittel: 'Hva skjer', kategori, bredde: 'breakout' });

// Dokumentsenter's categories (Søknader, Bygging, HMS, Skjemaer) come from dokumentsenter-data.mjs. ABC-nytt issues
// and protocols are their own types (`abcUtgave`, `generalforsamling`), not categories (run.mjs).
export const KATEGORIER = [
  ['arsberetninger', 'Årsberetninger', 'dato'],
  ['vedtekter', 'Vedtekter og regler', 'tittel'],
  ['dugnad', 'Dugnad', 'tittel'],
];

// `forelder` = parent page id suffix; null for a top-level page. Most migrated pages live under Praktisk info.
const side = (id, tittel, { forelder = 'praktisk-info', ikon, kort, rekkefolge = 100, overskrift, ingress, kontaktboks, innhold = [], gamleUrler = [] }) => ({
  _id: `side-${id}`, _type: 'side', tittel, ...(overskrift && { overskrift }), slug: slug(id), ...(forelder && { forelder: ref(`side-${forelder}`) }), ikon, kort, rekkefolge, ingress, ...(kontaktboks && { kontaktboks }), innhold, gamleUrler,
});

// Pages are stored as sections; the content above is authored as one rich text list per page
const medSeksjoner = (sider) =>
  sider.map(({ innhold, ...side }) => ({ ...side, seksjoner: tilSeksjoner(innhold, sider.some((s) => s.forelder?._ref === side._id)) }));

const ansvar = (omraade, beskrivelse, ikon) => ({ _type: 'ansvarsomraade', _key: key(), omraade, beskrivelse, ikon });
const medlem = (navn, rolle, tun, telefon, epost, kontaktperson = false, ansvarsomraader = [], vara = false) =>
  ({ _type: 'medlem', _key: key(), navn, rolle, tun, telefon, epost, kontaktperson, vara, ...(ansvarsomraader.length && { ansvar: ansvarsomraader }) });

// `protokoll2026` = _id of the 2026 generalforsamling; `dokumentId(old title)` = a document's _id (both resolved by run.mjs)
export function buildContent({ protokoll2026, dokumentId }) {
  const kategorier = [
    ...KATEGORIER.map(([id, tittel, sortering]) => ({ _id: `kategori-${id}`, _type: 'dokumentkategori', tittel, slug: slug(id), sortering })),
    ...dokumentsenter.KATEGORIER.map(({ slug: s, ...k }) => ({ ...k, _type: 'dokumentkategori', slug: slug(s), sortering: 'rekkefolge' })),
  ];
  const oppgaver = dokumentsenter.oppgaver(dokumentId);

  const utvalg = [
    {
      _id: 'utvalg-styret', _type: 'utvalg', navn: 'Styret',
      medlemmer: [
        medlem('Anders Jordal', 'Styreleder', 'A-tunet', '993 46 090', 'styreleder@arnatveit-borettslag.no', true, [ansvar('Forsikringssaker', 'Skader på bygningene og spørsmål om borettslagets forsikring.', 'Shield')]),
        medlem('Arild Angelskår', 'Nestleder og byggesaker', 'B-tunet', '901 58 413', 'nestleder@arnatveit-borettslag.no', false, [ansvar('Byggesaker', 'Utbygging, varmepumpe og andre endringer på boligen eller uteområdet.', 'House')]),
        medlem('Stian A. Persson', 'Økonomiansvarlig', 'Ekstern', '977 75 994', 'okonomi@arnatveit-borettslag.no', false, [ansvar('Leverandører', 'Er du leverandør og ønsker kontakt med Arnatveit Borettslag?', 'Briefcase')]),
        { ...medlem('Irene Myking', 'ABC-nytt', 'A-tunet', undefined, 'styret@arnatveit-borettslag.no', false, [], true), abcRedaktor: true },
        medlem('Christer Aarø', 'Webansvarlig', 'B-tunet', '41 16 08 41', 'styret@arnatveit-borettslag.no'),
        medlem('Gro Helen Andersen', 'Dugnadsansvarlig', 'A-tunet', undefined, 'styret@arnatveit-borettslag.no'),
        medlem('Ann Cicilie Tveiten', 'HMS-ansvarlig', 'C-tunet', undefined, 'styret@arnatveit-borettslag.no', false, [], true),
      ],
    },
    {
      _id: 'utvalg-miljoutvalget', _type: 'utvalg', navn: 'Miljøutvalget',
      medlemmer: [
        ...['Bente Birkeland', 'Marit G. Holmas', 'Steinar Endresen', 'Eva Kayser', 'Maria Sofie Nesse', 'Anne Liv Johannessen'].map((x) => medlem(x, undefined, 'A-tunet')),
        medlem('Hanne Espe', undefined, 'B-tunet'),
        ...['Siren Eikevik', 'Liss M. Larsen', 'Tine-Hjartnes Henjum'].map((x) => medlem(x, undefined, 'C-tunet')),
        ...['Tove Samuelsen', 'Lisbeth L. Strand'].map((x) => ({ ...medlem(x, undefined, 'A-tunet'), beplanting: true })),
      ],
    },
    // Names were blank on the old site — fill in via Studio, then add a Medlemsliste block to Generalforsamling
    { _id: 'utvalg-valgkomiteen', _type: 'utvalg', navn: 'Valgkomiteen', beskrivelse: 'For perioden 2025-26', medlemmer: [] },
  ];

  const sider = medSeksjoner([
    side('praktisk-info', 'Praktisk info', {
      forelder: null, rekkefolge: 10, gamleUrler: ['/praktiskinfo'],
      ingress: 'Alt du trenger å vite som andelseier, samlet på ett sted.',
      innhold: praktisk.SEKSJONER,
    }),
    side('generalforsamling', 'Generalforsamling', {
      ikon: 'Users', kort: 'Borettslagets øverste organ, bestående av andelseierne. Innkallinger og protokoller.', rekkefolge: 10, gamleUrler: ['/praktiskinfo/generalforsamling'],
      ingress: generalforsamling.INGRESS,
      // Protocols are `generalforsamling` documents (run.mjs); Årsberetninger isn't in the design but is kept
      innhold: [
        ...generalforsamling.SEKSJONER,
        { ...dokumentliste('arsberetninger', 'Årsberetninger', 'tidslinje'), bredde: 'bred' },
      ],
    }),
    side('vedtekter', 'Vedtekter', {
      ikon: 'Book', kort: 'Reglene borettslaget drives etter, vedtatt av generalforsamlingen.', rekkefolge: 20, gamleUrler: ['/praktiskinfo/vedtekter'],
      overskrift: vedtekter.OVERSKRIFT,
      ingress: vedtekter.INGRESS,
      // Statutes and house rules stay `dokument`s (description and date from vedtekter-data.mjs, set in run.mjs)
      innhold: vedtekter.SEKSJONER,
    }),
    side('styret', 'Styret', {
      ikon: 'Shield', kort: 'Andelseiere fra hvert av lagets tre tun. Se hvem som sitter og hvordan du når dem.', rekkefolge: 30, gamleUrler: ['/praktiskinfo/styret'],
      ingress: 'Styret består av andelseiere fra alle tre tun, og velges av generalforsamlingen. Finn riktig person nedenfor, eller skriv til hele styret.',
      kontaktboks: { tittel: 'Skriv til hele styret' },
      innhold: [
        { _type: 'ansvarsliste', _key: key(), tittel: 'Hvem kontakter jeg?' },
        { ...medlemsliste('styret'), tittel: 'Styremedlemmer' },
        p('Saker du ønsker at styret skal behandle må sendes skriftlig, minst en uke før oppsatt møte. Du kan enten sende dette til ', ['styret@arnatveit-borettslag.no', 'mailto:styret@arnatveit-borettslag.no'], ', eller legge din henvendelse i vår postkasse i A-tunet.'),
        p('Styremøtene gjennomføres ca. en gang i måneden, og gjennomføres i styrebrakka.'),
        h2('Kunne du tenkt deg å bli styremedlem?'),
        p('Det er både givende og lærerikt å være med i et borettslagsstyre. Funksjonen er å administrere borettslaget etter de vedtekter og lover som til en hver tid gjelder, samt å sørge for en stabil og forsvarlig økonomi. I tillegg er det også spennende å få være med i ulike prosjekter som gir oss alle et bedre bomiljø. Som styremedlem vil du bli registrert med næringsinteresse i Brønnøysundregisteret.'),
        p('Arnatveit Borettslag har en egen valgkomité med representanter fra hvert tun. Kontakt representanten i ditt tun, dersom du ønsker å melde deg som styremedlem.'),
      ],
    }),
    side('abc-nytt', 'ABC-nytt', {
      ikon: 'Newspaper', kort: 'Informasjonsbladet som kommer ut omtrent seks ganger i året.', rekkefolge: 40, gamleUrler: ['/praktiskinfo/abc-nytt'],
      ingress: 'Borettslagets informasjonsblad. Det kommer ut rundt seks ganger i året, i postkassen og her.',
      innhold: [
        { _type: 'abcUtgaver', _key: 'utgaver', innspillTittel: 'Har du noe til neste nummer?', innspillTekst: 'Tips, bilder og beskjeder til naboene er velkomne.', bredde: 'bred' },
        h2('Karneval'),
        p(['Karneval Arnatveit borettslag, februar 1988 (video på YouTube)', 'https://www.youtube-nocookie.com/embed/TjHea3av-rU']),
      ],
    }),
    side('dugnad', 'Dugnad', {
      ikon: 'Sprout', kort: 'Felles innsats som holder kostnadene nede, og som er sosialt og utviklende.', rekkefolge: 50, gamleUrler: ['/praktiskinfo/dugnad'],
      ingress: 'Dugnadsinnsatsen til andelseierne holder fellesutgiftene nede. Og du får betalt for timene du legger ned.',
      innhold: [
        hvaSkjer('dugnad'),
        nokkeltall('Slik fungerer dugnad', [
          ['150 kr', 'per time for voksne og barn over 13 år'],
          ['50 kr', 'per time for barn mellom 7 og 13 år'],
          ['2 400 kr', 'i året kan du tjene inn, like mye som dugnadspengene i husleien'],
        ]),
        p('Dugnadspengene på 200 kr i måneden er inkludert i husleien, og dugnaden utbetales én gang i året. Siden borettslaget ikke har vaktmester, er dugnaden viktig for oss alle. Dugnad utenom fellesdugnadene avtales på forhånd med styret.'),
        dokumentliste('dugnad'),
        p('Utførte dugnadstimer skal kvitteres av en fra styret. Dugnadskortet fylles ut av andelseier og leveres til dugnadsansvarlig.'),
        p('Borettslaget omfattes av forskrifter om HMS. Ved utførelse av dugnad er den enkelte beboer pliktig til å utføre arbeidet på en slik måte at skade unngås. For eksempel vil det for enkelte arbeidsoppgaver være aldersgrense (bruk av gressklipper, motorsag og lignende).'),
      ],
    }),
    side('miljoutvalget', 'Miljøutvalget', {
      ikon: 'Heart', kort: 'Aktiviteter for beboerne som bidrar til et godt bomiljø.', rekkefolge: 60, gamleUrler: ['/praktiskinfo/miljoutvalget'],
      ingress: 'Miljøutvalet har blandt anna ansvar for sosiale arrangement i borettslaget og for gjennomføring av årlig dugnad.',
      innhold: [
        hvaSkjer('sosialt'),
        { ...medlemsliste('miljoutvalget'), tittel: 'Utvalget', ingress: 'Miljøutvalget har medlemmer fra alle tre tun.', visning: 'tun', bredde: 'breakout' },
      ],
    }),
    side('dokumentsenter', 'Dokumentsenter', {
      forelder: null, rekkefolge: 20, gamleUrler: ['/praktiskinfo/dokumentsenter'],
      ingress: dokumentsenter.INGRESS,
      innhold: dokumentsenter.seksjoner(oppgaver.map((o) => o._id)),
    }),
    // "Om oss og kontakt": the old Kontakt page is merged in; its addresses redirect to #kontakt
    side('om-borettslaget', 'Om borettslaget', {
      forelder: null, rekkefolge: 30, gamleUrler: ['/kontakt#kontakt', '/kontakt-oss#kontakt'],
      ingress: 'Arnatveit Borettslag består av rekkehus fordelt på tre tun i Arna, Bergen. Her finner du kontaktinformasjon, adresser og fakta om borettslaget.',
      innhold: [
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
            p('Borettslaget har gode og romslige fellesarealer, med lekeplass i hvert tun og egen ballplass. Ett av tunene er bilfritt med felles parkeringsanlegg; de to andre har parkering ved husene.'),
            p('Området har nær tilgang til et rikholdig tur- og friluftsområde, og det er gangavstand til barneskole, buss og butikk. Det er kort vei til Øyrane Torg og togstasjonen, med tog til Bergen sentrum hver halvtime.'),
          ],
        },
        { _type: 'borettslagsfakta', _key: 'fakta', tittel: 'Fakta', ingress: 'Offisielle opplysninger om borettslaget, blant annet til bruk ved kjøp og salg.', bredde: 'bred' },
      ],
    }),
  ]);

  const nyheter = [
    {
      _id: 'nyhet-generalforsamling-2026', _type: 'nyhet', tittel: 'Årets generalforsamling er avholdt', slug: slug('generalforsamling-2026'),
      dato: '2026-05-28', kategori: aktuelt.kategoriRef(aktuelt.GF_2026.kategori),
      ingress: 'Møtet for 2026 ble gjennomført torsdag 28. mai i lokalene til Arna Misjonsmenighet.',
      fakta: aktuelt.GF_2026.fakta,
      // Blocks like on pages: text, link row (date/place are fields, shown in the header; attachments their own field)
      seksjoner: [
        ...tilSeksjoner([p('Du finner både årets og tidligere referater samlet på ', ['en egen side', '#side-generalforsamling'], '.')]),
        aktuelt.relatert(aktuelt.GF_2026.relatert),
      ],
      dokumenter: [keyedRef(protokoll2026)],
    },
  ];

  const innstillinger = {
    _id: 'innstillinger', _type: 'innstillinger', navn: 'Arnatveit Borettslag',
    beskrivelse: 'Rekkehus i tre tun i Arna, Bergen.',
    hovedmeny: [
      lenke('Praktisk info', '#side-praktisk-info'),
      lenke('Dokumentsenter', '#side-dokumentsenter'),
      lenke('Om oss og kontakt', '#side-om-borettslaget'),
      lenke(aktuelt.MENY.til, '/aktuelt'),
    ].map((l) => ({ ...l, _key: key() })),
    banner: { aktiv: true, tekst: 'Generalforsamlingen 2026 ble avholdt 28. mai.', sisteProtokoll: true, lenke: { _type: 'lenke', tekst: 'Les protokollen' } },
  };

  // Contact details and facts (the contact person is the member with `kontaktperson` on)
  const omBorettslaget = {
    _id: 'omBorettslaget', _type: 'omBorettslaget',
    epost: 'styret@arnatveit-borettslag.no',
    styreNotat: 'Saker du ønsker at styret skal behandle, må sendes skriftlig minst én uke før oppsatt styremøte.',
    besoksadresse: 'Stuajordet 11–185\n5262 Arnatveit',
    kartlenke: 'https://www.google.com/maps/search/?api=1&query=Stuajordet+11,+5262+Arnatveit',
    postadresse: 'Arnatveit Borettslag\nc/o BOB\nPostboks 7280\n5020 Bergen',
    postNotat: 'Post til styret går via forretningsfører.',
    fakturaadresse: 'Arnatveit Borettslag\nOrg.nr. 946 024 627\nPostboks 2715\n7439 Trondheim',
    fakturaNotat: 'For leverandører.',
    fakturaEpost: 'fakturamottak@bob.no',
    juridiskNavn: 'Arnatveit Borettslag', orgnr: '946 024 627', selskapsform: 'Borettslag',
    forretningsforer: 'Bergen og omegn Boligbyggerlag (BOB)', revisor: 'KPMG AS', stiftet: '1984-11-06', andeler: 79, tun: 3,
  };

  const forside = {
    _id: 'forside', _type: 'forside',
    overtittel: 'Arna · Bergen',
    tittel: 'Rekkehus i tre tun, med turterrenget rett utenfor døra',
    ingress: 'Et veldrevet borettslag med romslige fellesarealer, lekeplass i hvert tun og egen ballplass. Gangavstand til skole, buss og butikk, og kort vei til Øyrane Torg og toget.',
    knapper: [lenke('Praktisk info', '#side-praktisk-info'), lenke('Kontakt styret', 'mailto:styret@arnatveit-borettslag.no')].map((l) => ({ ...l, _key: key() })),
    faktaseksjon: {
      overtittel: 'Å bo her',
      tittel: 'Tre tun, ett nabolag',
      tekst: 'Rekkehusene ligger samlet rundt tre tun, med kort vei til skole, buss og butikk, og til turterrenget.',
    },
    fakta: [
      ['3 tun', 'Ett av dem bilfritt, med felles parkeringsanlegg.', null],
      ['Lekeplasser', 'En i hvert tun, pluss egen ballplass.', 'Huske'],
      ['Turterreng', 'Rikholdig friluftsområde rett ved husene.', 'Mountain'],
      ['Sunn økonomi', 'Et veldrevet borettslag med ryddig drift.', 'TrendingUp'],
    ].map(([tittel, tekst, ikon]) => ({ _type: 'faktakort', _key: key(), tittel, tekst, logo: !ikon, ...(ikon && { ikon }) })),
    dokumentsenter: {
      tittel: 'Skal du bygge ut, montere varmepumpe eller skaffe husdyr?',
      tekst: 'Dette skal styret ha søknad om. Her finner du standardsøknader og prosedyrer.',
      lenke: lenke('Gå til dokumentsenteret', '#side-dokumentsenter'),
      // Tasks open their steps on Dokumentsenter; see forside-snarveier.mjs
      dokumenter: ['oppgave-bygg', 'oppgave-varmepumpe', 'oppgave-husdyr', 'dokument-vedtekter-vedtekter-2016'].map(keyedRef),
    },
  };

  return [innstillinger, omBorettslaget, forside, ...kategorier, ...aktuelt.KATEGORIER, ...praktisk.SPORSMAL, ...oppgaver, ...utvalg, ...sider, ...nyheter];
}
