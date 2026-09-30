// Vedtekter content per the design, shared by the dataset migration (vedtekter.mjs) and the import (content.mjs,
// run.mjs): page heading and ingress, the sections, and the two documents' description and "Sist endret" date.
// Dates from the PDFs: the statutes were last changed at the general assembly on 12 April 2016; the newest change
// the house rules mention was approved on 18 June 2002.

export const OVERSKRIFT = 'Vedtekter og regler';
export const INGRESS = 'Arnatveit Borettslag drives etter vedtekter vedtatt av generalforsamlingen, i henhold til borettslagsloven. I tillegg har vi egne husordensregler.';

// Document _id → fields set on it
export const DOKUMENTER = {
  'dokument-vedtekter-vedtekter-2016': {
    dato: '2016-04-12',
    beskrivelse: 'Borettslagets egne regler for drift, styre, generalforsamling og andelseiernes rettigheter og plikter.',
  },
  'dokument-vedtekter-husordensregler': {
    dato: '2002-06-18',
    beskrivelse: 'Regler for hverdagen: hvordan vi bruker boligene og fellesarealene, og tar hensyn til hverandre.',
  },
};

const ref = (_ref, _key) => ({ _type: 'reference', _ref, ...(_key && { _key }) });
const nivaa = (_key, tittel, tekst) => ({ _type: 'nivaa', _key, tittel, tekst });
const lenke = (_key, side, tekst) => ({ _type: 'relatertLenke', _key, side: ref(side), tekst });

export const SEKSJONER = [
  {
    _type: 'regelverk', _key: 'regelverk',
    dokumenter: Object.keys(DOKUMENTER).map((id, i) => ref(id, `dok${i + 1}`)),
    lovTittel: 'Borettslagsloven',
    lovBeskrivelse: 'Lov om borettslag gjelder for alle borettslag i Norge, og setter rammene for vedtektene.',
    lovUrl: 'https://lovdata.no/dokument/NL/lov/2003-06-06-39',
  },
  {
    _type: 'nivaaer', _key: 'sammenheng', tittel: 'Hvordan henger reglene sammen?',
    tekst: 'Loven setter rammene, vedtektene tilpasser dem til Arnatveit, og husordensreglene gjelder hverdagen. Er du usikker på hva som gjelder, spør styret.',
    nivaaer: [
      nivaa('lov', 'Borettslagsloven', 'Gjelder alle borettslag i Norge.'),
      nivaa('vedtekter', 'Vedtekter', 'Arnatveits egne regler, innenfor loven. Endres av generalforsamlingen.'),
      nivaa('husorden', 'Husordensregler', 'Utfyller vedtektene med regler for hverdagen.'),
    ],
  },
  {
    _type: 'relatert', _key: 'relatert', tittel: 'Relatert',
    lenker: [
      lenke('gf', 'side-generalforsamling', 'Der vedtektsendringer behandles'),
      lenke('dokumentsenter', 'side-dokumentsenter', 'Søknader om husdyr, utleie, varmepumpe og bygging'),
    ],
  },
];
