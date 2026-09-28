// Hand-curated content from the old site (verbatim text, obvious typos fixed — see docs/MIGRATION.md).
// Everything uses deterministic _ids so the import can be re-run safely.
import { tilSeksjoner } from './seksjoner-lib.mjs';

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
const dokumentliste = (kategori, tittel, grupperEtterAar = false) => ({ _type: 'dokumentliste', _key: key(), tittel, kategori: ref(`kategori-${kategori}`), grupperEtterAar });
const medlemsliste = (id) => ({ _type: 'medlemsliste', _key: key(), utvalg: ref(`utvalg-${id}`) });
const faktaliste = (tittel, rader) => ({ _type: 'faktaliste', _key: key(), tittel, rader: rader.map(([etikett, verdi]) => ({ _type: 'rad', _key: key(), etikett, verdi })) });
const infoboks = (tittel, ...tekst) => ({ _type: 'infoboks', _key: key(), tittel, tekst });
const lenke = (tekst, target) => ({ _type: 'lenke', tekst, ...(target.startsWith('#') ? { intern: ref(target.slice(1)) } : { url: target }) });
const lenkeknapp = (tekst, target) => ({ _type: 'lenkeknapp', _key: key(), lenke: lenke(tekst, target) });

export const KATEGORIER = [
  ['protokoller', 'Protokoller', 'dato'],
  ['arsberetninger', 'Årsberetninger', 'dato'],
  ['abc-nytt', 'ABC-nytt', 'dato'],
  ['soknader-og-skjema', 'Søknader og skjema', 'tittel'],
  ['hms', 'HMS', 'tittel'],
  ['vedtekter', 'Vedtekter og regler', 'tittel'],
  ['dugnad', 'Dugnad', 'tittel'],
];

// `forelder` = parent page id suffix; null for a top-level page. Most migrated pages live under Praktisk info.
const side = (id, tittel, { forelder = 'praktisk-info', ikon, kort, rekkefolge = 100, ingress, kontaktboks, innhold = [], gamleUrler = [] }) => ({
  _id: `side-${id}`, _type: 'side', tittel, slug: slug(id), ...(forelder && { forelder: ref(`side-${forelder}`) }), ikon, kort, rekkefolge, ingress, ...(kontaktboks && { kontaktboks }), innhold, gamleUrler,
});

// Pages are stored as sections; the content above is authored as one rich text list per page
const medSeksjoner = (sider) =>
  sider.map(({ innhold, ...side }) => ({ ...side, seksjoner: tilSeksjoner(innhold, sider.some((s) => s.forelder?._ref === side._id)) }));

const ansvar = (omraade, beskrivelse, ikon) => ({ _type: 'ansvarsomraade', _key: key(), omraade, beskrivelse, ikon });
const medlem = (navn, rolle, tun, telefon, epost, kontaktperson = false, ansvarsomraader = [], vara = false) =>
  ({ _type: 'medlem', _key: key(), navn, rolle, tun, telefon, epost, kontaktperson, vara, ...(ansvarsomraader.length && { ansvar: ansvarsomraader }) });

// `protokoll2026` = _id of the newest GF protocol dokument (resolved by run.mjs)
export function buildContent({ protokoll2026 }) {
  const kategorier = KATEGORIER.map(([id, tittel, sortering]) => ({ _id: `kategori-${id}`, _type: 'dokumentkategori', tittel, slug: slug(id), sortering }));

  const utvalg = [
    {
      _id: 'utvalg-styret', _type: 'utvalg', navn: 'Styret',
      medlemmer: [
        medlem('Anders Jordal', 'Styreleder', 'A-tunet', '993 46 090', 'styreleder@arnatveit-borettslag.no', true, [ansvar('Forsikringssaker', 'Skader på bygningene og spørsmål om borettslagets forsikring.', 'Shield')]),
        medlem('Arild Angelskår', 'Nestleder og byggesaker', 'B-tunet', '901 58 413', 'nestleder@arnatveit-borettslag.no', false, [ansvar('Byggesaker', 'Utbygging, varmepumpe og andre endringer på boligen eller uteområdet.', 'House')]),
        medlem('Stian A. Persson', 'Økonomiansvarlig', 'Ekstern', '977 75 994', 'okonomi@arnatveit-borettslag.no', false, [ansvar('Leverandører', 'Er du leverandør og ønsker kontakt med Arnatveit Borettslag?', 'Briefcase')]),
        medlem('Irene Myking', 'ABC-nytt', 'A-tunet', undefined, 'styret@arnatveit-borettslag.no', false, [], true),
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
        ...['Tove Samuelsen', 'Lisbeth L. Strand'].map((x) => medlem(x, 'Utvidet beplantingsutvalg', 'A-tunet')),
      ],
    },
    // Names were blank on the old site — fill in via Studio, then add a Medlemsliste block to Generalforsamling
    { _id: 'utvalg-valgkomiteen', _type: 'utvalg', navn: 'Valgkomiteen', beskrivelse: 'For perioden 2025-26', medlemmer: [] },
  ];

  const sider = medSeksjoner([
    side('praktisk-info', 'Praktisk info', {
      forelder: null, rekkefolge: 10, gamleUrler: ['/praktiskinfo'],
      ingress: 'Alt du trenger å vite som andelseier, samlet på ett sted.',
    }),
    side('generalforsamling', 'Generalforsamling', {
      ikon: 'Users', kort: 'Borettslagets øverste organ, bestående av andelseierne. Innkallinger og protokoller.', rekkefolge: 10, gamleUrler: ['/praktiskinfo/generalforsamling'],
      ingress: 'Generalforsamlingen er borettslagets øverste organ, og består av andelseierne.',
      innhold: [
        h2('Om generalforsamlingen'),
        p('Generalforsamlingen er borettslagets øverste organ, og består av andelseierne. Styret skal kalle inn til generalforsamling etter lagets vedtekter og borettslagsloven.'),
        p('Generalforsamlingen velger styret som skal bestå av representanter fra borettslagets tre tun. I tillegg har Arnatveit Borettslag valgt at styret også skal bestå av ett eksternt styremedlem.'),
        p('Før generalforsamlingen starter har en valgkomite jobbet med å finne fram til kandidater som ønsker å sitte i borettslagets styre. Disse skal erstatte styremedlemmer som er på valg, og som ønsker å fratre.'),
        p('Ekstraordinær generalforsamling kan finne sted i et borettslag. Da er det kun én enkeltsak som skal behandles. Slike ekstraordinære generalforsamlinger holdes når styret finner det nødvendig, eller når revisor eller minst to andelseiere, som tilsammen har minst 1/10 del av lagets totale stemmer, krever det, og samtidig oppgir hvilken sak som ønskes behandlet.'),
        h3('Valgkomiteen i Arnatveit Borettslag'),
        p('Valgkomiteen består av representanter fra hvert av Arnatveit Borettslags tre tun.'),
        dokumentliste('protokoller', 'Protokoller'),
        dokumentliste('arsberetninger', 'Årsberetninger'),
      ],
    }),
    side('vedtekter', 'Vedtekter', {
      ikon: 'Book', kort: 'Reglene borettslaget drives etter, vedtatt av generalforsamlingen.', rekkefolge: 20, gamleUrler: ['/praktiskinfo/vedtekter'],
      ingress: 'Arnatveit Borettslag drives etter vedtekter som er vedtatt av generalforsamlingen, og i henhold til lov om borettslag.',
      innhold: [
        p('Arnatveit Borettslag drives etter vedtekter som er vedtatt av generalforsamlingen, og i henhold til lov om borettslag. I tillegg til vedtektene har borettslaget også utarbeidet egne husordensregler.'),
        p('Det er generalforsamlingen som gjør vedtektsendringer i henhold til borettslagsloven. Nedenfor finner du lenker til vedtekter, husordensregler og borettslagsloven.'),
        dokumentliste('vedtekter', 'Vedtekter og husordensregler'),
        h2('Borettslagsloven'),
        p(['Lov om borettslag, Lovdata', 'https://lovdata.no/dokument/NL/lov/2003-06-06-39']),
      ],
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
      ingress: 'Dette er borettslagets informasjonsorgan, og kommer ut ca 6 ganger i året.',
      innhold: [
        p('Under finner du tidligere utgaver.'),
        dokumentliste('abc-nytt', 'Utgaver', true),
        h2('Karneval'),
        p(['Karneval Arnatveit borettslag, februar 1988 (video på YouTube)', 'https://www.youtube-nocookie.com/embed/TjHea3av-rU']),
      ],
    }),
    side('dugnad', 'Dugnad', {
      ikon: 'Sprout', kort: 'Felles innsats som holder kostnadene nede, og som er sosialt og utviklende.', rekkefolge: 50, gamleUrler: ['/praktiskinfo/dugnad'],
      ingress: 'Dugnadsinnsatsen til andelseiere i borettslaget er med på å holde fellesutgiftene nede.',
      innhold: [
        p('Arbeid vi kan gjøre som dugnad ville ellers ha kostet en del penger å leie inn folk til å gjøre. Vedlikehold av borettslagets uteområder blir oftest kalt dugnad. Siden borettslaget ikke har noen ansatt vaktmester, er dugnaden et tiltak som er viktig for oss alle.'),
        p('Dugnadsarbeid er likevel ikke gratisarbeid. I vårt borettslag får du betalt penger for å arbeide dugnad. Ofte er det miljøutvalget eller styret som inviterer til dette.'),
        p('Nedenfor finner du informasjon til deg som jobber dugnad sammen med dugnadslisten. Utfylte dugnadslister legger du i borettslagets postkasse i A-tunet.'),
        infoboks('Først og fremst, takk for innsatsen!',
          p('Hver andelseier betaler kr. 2.400,- hvert år i dugnadspenger. Dette er inkludert i husleien med kr. 200,- pr. mnd. Hver andelseier kan tjene kr. 2.400,- pr. år i dugnad.'),
          p('Dugnadsarbeid utbetales med kr. 150,- pr. time for voksne (barn over 13 år). kr. 50,- pr. time for barn (mellom 7 og 13 år). Dugnad blir utbetalt én gang pr. år.'),
        ),
        p('Dugnad utenom fellesdugnader, må avtales på forhånd med styret. Utførte dugnadstimer skal kvitteres av en fra styret. Dugnadskortet fylles ut av andelseier og leveres til dugnadsansvarlig.'),
        p('Borettslaget omfattes av forskrifter om HMS. Ved utførelse av dugnad er den enkelte beboer pliktig til å utføre arbeidet på en slik måte at skade unngås. For eksempel vil det for enkelte arbeidsoppgaver være aldersgrense (bruk av gressklipper, motorsag og lignende).'),
        dokumentliste('dugnad', 'Dugnadskort'),
      ],
    }),
    side('miljoutvalget', 'Miljøutvalget', {
      ikon: 'Heart', kort: 'Aktiviteter for beboerne som bidrar til et godt bomiljø.', rekkefolge: 60, gamleUrler: ['/praktiskinfo/miljoutvalget'],
      ingress: 'Miljøutvalet har blandt anna ansvar for sosiale arrangement i borettslaget og for gjennomføring av årlig dugnad.',
      innhold: [
        p('På denne siden vil informasjon om slikt bli lagt ut.'),
        h2('Utvalget består av'),
        medlemsliste('miljoutvalget'),
      ],
    }),
    side('dokumentsenter', 'Dokumentsenter', {
      forelder: null, rekkefolge: 20, gamleUrler: ['/praktiskinfo/dokumentsenter'],
      ingress: 'Skal du bygge ut, montere varmepumpe, eller ønsker dere husdyr? Dette skal styret ha søknad om.',
      innhold: [
        p('Under finner du standardsøknader og prosedyrer for søknader.'),
        dokumentliste('soknader-og-skjema', 'Dokumenter'),
        dokumentliste('hms', 'HMS'),
      ],
    }),
    side('om-borettslaget', 'Om borettslaget', {
      forelder: null, rekkefolge: 30, gamleUrler: [],
      ingress: 'Arnatveit Borettslag består av hus i rekke, fordelt på tre tun, hvorav ett er bilfritt med felles parkeringsanlegg. De to andre tunene har parkeringsmuligheter ved husene.',
      innhold: [
        p('Borettslaget har gode og romslige fellesarealer med lekeplasser i hver tun, i tillegg til egen ballplass.'),
        p('Området borettslaget ligger i har nær tilgang til et rikholdig tur- og friluftsområde, gangavstand til moderne barneskole, buss og butikk. Det er kort vei til Øyrane Torg og togstasjon. Det går tog fra Arna til Bergen sentrum hver halvtime. Borettslaget er veldrevet med sunn økonomi.'),
        faktaliste('Fakta', [
          ['Juridisk navn', 'Arnatveit Borettslag'],
          ['Organisasjonsnummer', '946 024 627'],
          ['Selskapsform', 'Borettslag'],
          ['Stiftelsesdato', '06.11.1984'],
          ['Antall andeler', '79'],
          ['Forretningsfører', 'Bergen og omegn Boligbyggerlag (BOB)'],
          ['Revisor', 'KPMG AS'],
        ]),
        { _type: 'kontaktinfo', _key: key(), visKart: false },
      ],
    }),
    side('kontakt', 'Kontakt', {
      forelder: null, rekkefolge: 40, gamleUrler: ['/kontakt-oss'],
      ingress: 'Saker du ønsker at styret skal behandle må sendes skriftlig, minst en uke før oppsatt møte.',
      innhold: [
        { _type: 'kontaktinfo', _key: key(), visKart: true },
        p('Leiter du etter skjema eller annen informasjon, ta en titt i ', ['dokumentsenteret', '#side-dokumentsenter'], '.'),
        p(['Her finner du oversikt over hvem som sitter i styret', '#side-styret'], ' og hvordan de kan kontaktes.'),
      ],
    }),
  ]);

  const nyheter = [
    {
      _id: 'nyhet-generalforsamling-2026', _type: 'nyhet', tittel: 'Årets generalforsamling er avholdt', slug: slug('generalforsamling-2026'),
      dato: '2026-05-28', merkelapp: 'Generalforsamling 2026', fremhevet: true,
      ingress: 'Møtet for 2026 ble gjennomført torsdag 28. mai i lokalene til Arna Misjonsmenighet.',
      innhold: [p('Du finner både årets og tidligere referater samlet på ', ['en egen side', '#side-generalforsamling'], '.')],
      dokumenter: [keyedRef(protokoll2026)],
    },
  ];

  const innstillinger = {
    _id: 'innstillinger', _type: 'innstillinger', navn: 'Arnatveit Borettslag',
    beskrivelse: 'Rekkehus i tre tun i Arna, Bergen.',
    hovedmeny: [
      lenke('Praktisk info', '#side-praktisk-info'),
      lenke('Dokumentsenter', '#side-dokumentsenter'),
      lenke('Om borettslaget', '#side-om-borettslaget'),
      lenke('Kontakt', '#side-kontakt'),
      lenke('Nytt', '/aktuelt'),
    ].map((l) => ({ ...l, _key: key() })),
    banner: { aktiv: true, tekst: 'Generalforsamlingen 2026 ble avholdt 28. mai.', lenke: lenke('Les protokollen', `#${protokoll2026}`) },
    kontakt: {
      epost: 'styret@arnatveit-borettslag.no',
      postadresse: 'Arnatveit Borettslag\nc/o BOB\nPostboks 7280\n5020 Bergen',
      besoksadresse: 'Stuajordet 11-185\n5262 Arnatveit',
      fakturaadresse: 'Arnatveit Borettslag\norg.nr.: 946024627\nPostboks 2715\n7439 Trondheim',
      fakturaEpost: 'fakturamottak@bob.no',
      orgnr: '946 024 627',
      kartlenke: 'https://www.google.com/maps/search/?api=1&query=Stuajordet+11,+5262+Arnatveit',
    },
  };

  const forside = {
    _id: 'forside', _type: 'forside',
    overtittel: 'Arna · Bergen',
    tittel: 'Rekkehus i tre tun, med turterrenget rett utenfor døra',
    ingress: 'Et veldrevet borettslag med romslige fellesarealer, lekeplass i hvert tun og egen ballplass. Gangavstand til skole, buss og butikk, og kort vei til Øyrane Torg og toget.',
    knapper: [lenke('Praktisk info', '#side-praktisk-info'), lenke('Kontakt styret', 'mailto:styret@arnatveit-borettslag.no')].map((l) => ({ ...l, _key: key() })),
    infokort: { tittel: 'Tog til Bergen sentrum', tekst: 'Avgang hver halvtime fra Arna' },
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
    snarvei: { merkelapp: 'Dugnad', tittel: 'Holder kostnadene nede – og er sosialt.', lenke: lenke('Se dugnadsplan', '#side-dugnad') },
    dokumentsenter: {
      tittel: 'Skal du bygge ut, montere varmepumpe eller skaffe husdyr?',
      tekst: 'Dette skal styret ha søknad om. Her finner du standardsøknader og prosedyrer.',
      lenke: lenke('Gå til dokumentsenteret', '#side-dokumentsenter'),
      dokumenter: ['dokument-dokumentsenter-rutiner-ved-bygging-av', 'dokument-dokumentsenter-soknad-varmepumpe', 'dokument-dokumentsenter-skjema-soknadomdyrehold', 'dokument-vedtekter-vedtekter-2016'].map(keyedRef),
    },
  };

  return [innstillinger, forside, ...kategorier, ...utvalg, ...sider, ...nyheter];
}
