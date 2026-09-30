// Dokumentsenter content per the design, shared by the dataset migration (dokumentsenter.mjs) and the import
// (content.mjs, run.mjs): the four categories, where each old document goes, and the "Jeg vil …" tasks.

export const KATEGORIER = [
  { _id: 'kategori-soknader', tittel: 'Søknader', slug: 'soknader', ingress: 'Dette må styret godkjenne før du setter i gang.', farge: 'oker', ikon: 'FileCheck' },
  { _id: 'kategori-bygging', tittel: 'Bygging', slug: 'bygging', ingress: 'Veiledning for ark, tilbygg og andre endringer på boligen.', farge: 'gronn', ikon: 'House' },
  { _id: 'kategori-hms', tittel: 'HMS', slug: 'hms', ingress: 'Sjekklister for fellesarealer, lekeplasser og el-anlegg.', farge: 'blaa', ikon: 'Shield' },
  { _id: 'kategori-skjemaer', tittel: 'Skjemaer', slug: 'skjemaer', ingress: 'Andre skjemaer til styret.', farge: 'sand', ikon: 'ClipboardList' },
];

// Old title (as imported) → [old title, new title or null, description, tun]; order = position within the category.
// "HMS-sjekkliste til beboere" isn't in the design; kept in HMS (decided 2026-09-30).
export const DOKUMENTER = {
  'kategori-soknader': [
    ['Søknad om bruksoverlating/utleie av hele boligen', 'Søknad om bruksoverlating / utleie av hele boligen', 'Gjelder både kort- og langtidsutleie.'],
    ['Søknad om dyrehold', null, 'Sendes før dyret flytter inn.'],
    ['Søknad om varmepumpe', null, 'Beskriv plassering av innedel og utedel.'],
  ],
  'kategori-bygging': [
    ['Sjekkliste ved bygging av ark eller tilbygg', null, 'Start her hvis du vurderer å bygge.'],
    ['Ansvarsforhold ved tilbygg', null, 'Hva du og borettslaget har ansvar for etterpå.'],
    ['Ark i Arnatveit Borettslag', null, 'Retningslinjer for utforming av ark.'],
  ],
  'kategori-hms': [
    ['Sjekkliste til beboere i Arnatveit Borettslag', 'Sjekkliste til beboere', 'Brann, el og sikkerhet i egen bolig.', 'Felles'],
    ['HMS-sjekkliste til beboere', null, null, 'Felles'],
    ['Sjekkliste for fellesarealer og gangstier', null, null, 'Felles'],
    ['Sjekkliste for stor lekeplass i A-tunet', 'Sjekkliste for stor lekeplass', null, 'A-tunet'],
    ['Sjekkliste for lekeplass mellom A- og C-tunet', null, null, 'A-tunet'],
    ['Sjekkliste for lekeplass i B-tunet', 'Sjekkliste for lekeplass', null, 'B-tunet'],
    ['Sjekkliste for el-anlegg på fellesareal i B-tunet', 'Sjekkliste for el-anlegg på fellesareal', null, 'B-tunet'],
    ['Sjekkliste for lekeplass i C-tunet', 'Sjekkliste for lekeplass', null, 'C-tunet'],
    ['Sjekkliste for el-anlegg på fellesareal i C-tunet', 'Sjekkliste for el-anlegg på fellesareal', null, 'C-tunet'],
  ],
  'kategori-skjemaer': [['Refusjon av private utlegg', null, 'For utlegg du har hatt på vegne av borettslaget.']],
};

/** Fields to set on a document by its old title (null if it isn't a Dokumentsenter document) */
export function dokumentFelter(tittel) {
  for (const [kategori, rader] of Object.entries(DOKUMENTER)) {
    const i = rader.findIndex(([t]) => t === tittel);
    if (i < 0) continue;
    const [, nyTittel, beskrivelse, tun] = rader[i];
    return { kategori: { _type: 'reference', _ref: kategori }, rekkefolge: i + 1, ...(nyTittel && { tittel: nyTittel }), ...(beskrivelse && { beskrivelse }), ...(tun && { tun }) };
  }
  return null;
}

/** The four tasks; `idFor(old title)` gives the document id a step links to */
export function oppgaver(idFor) {
  const ref = (_ref) => ({ _type: 'reference', _ref });
  const steg = (_key, tekst, tittel) => ({ _type: 'oppgavesteg', _key, tekst, ...(tittel && { dokumenter: [{ ...ref(idFor(tittel)), _key: 'd1' }] }) });
  return [
    {
      _id: 'oppgave-bygg', tittel: 'Bygge ark eller tilbygg', ikon: 'House', aksent: 'gronn',
      kontakttekst: 'Arild Angelskår har ansvar for byggesaker.', kontaktEpost: 'nestleder@arnatveit-borettslag.no',
      steg: [
        steg('s1', 'Les retningslinjene for ark', 'Ark i Arnatveit Borettslag'),
        steg('s2', 'Gå gjennom sjekklisten', 'Sjekkliste ved bygging av ark eller tilbygg'),
        steg('s3', 'Sett deg inn i ansvarsforholdet', 'Ansvarsforhold ved tilbygg'),
        steg('s4', 'Send søknad til styret før du starter arbeidet'),
      ],
    },
    {
      _id: 'oppgave-utleie', tittel: 'Leie ut boligen', ikon: 'Key', aksent: 'oker', kontakttekst: 'Send søknaden til styret.',
      steg: [steg('s1', 'Fyll ut søknaden', 'Søknad om bruksoverlating/utleie av hele boligen'), steg('s2', 'Send den til styret før leieforholdet starter')],
    },
    {
      _id: 'oppgave-husdyr', tittel: 'Skaffe husdyr', ikon: 'PawPrint', aksent: 'oker', kontakttekst: 'Send søknaden til styret.',
      steg: [steg('s1', 'Fyll ut søknaden', 'Søknad om dyrehold'), steg('s2', 'Send den til styret før dyret flytter inn')],
    },
    {
      _id: 'oppgave-varmepumpe', tittel: 'Montere varmepumpe', ikon: 'AirVent', aksent: 'oker', kontakttekst: 'Send søknaden til styret.',
      steg: [steg('s1', 'Fyll ut søknaden, med plassering av inne- og utedel', 'Søknad om varmepumpe'), steg('s2', 'Vent på godkjenning før pumpen monteres')],
    },
  ].map((o) => ({ _type: 'oppgave', ...o }));
}

export const INGRESS = 'Søknader, veiledninger og sjekklister. Skal du bygge ut, montere varmepumpe eller skaffe husdyr, må styret ha søknad først.';

/** The page's sections */
export const seksjoner = (oppgaveIds) => [
  { _type: 'oppgaver', _key: 'jeg-vil', tittel: 'Jeg vil …', ingress: 'Velg en oppgave for å se steg for steg hva du må gjøre.', oppgaver: oppgaveIds.map((id) => ({ _type: 'reference', _ref: id, _key: id })), bredde: 'bred' },
  { _type: 'dokumentliste', _key: 'alle-dokumenter', tittel: 'Alle dokumenter', visning: 'sok', kategorier: KATEGORIER.map((k) => ({ _type: 'reference', _ref: k._id, _key: k.slug })), bredde: 'breakout' },
];
