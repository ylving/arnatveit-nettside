// Praktisk info per the design, shared by the dataset migration (praktisk-info.mjs) and the import (content.mjs):
// the frequently asked questions (vanligSporsmal documents) and the page's sections (grouped link rows, questions,
// closing call to action). Texts from the «Praktisk info» artboard.
const ref = (_ref) => ({ _type: 'reference', _ref });
const lenke = (tekst, intern) => ({ _type: 'lenke', tekst, intern: ref(intern) });
const sporsmal = (id, sp, svar, lenkeTekst, lenkeTil) => ({ _id: `sporsmal-${id}`, _type: 'vanligSporsmal', sporsmal: sp, svar, lenke: lenke(lenkeTekst, lenkeTil) });

export const SPORSMAL = [
  sporsmal('skade', 'Hvem kontakter jeg ved skade på bygningene?',
    'Forsikringssaker håndteres av styreleder Anders Jordal, på telefon 993 46 090. Gjelder det noe annet, skriv til styret@arnatveit-borettslag.no.',
    'Se hele styret', 'side-styret'),
  sporsmal('husdyr', 'Kan jeg ha husdyr?',
    'Du må søke styret før dyret flytter inn. Søknadsskjemaet finner du i dokumentsenteret.',
    'Søknad om dyrehold', 'dokument-dokumentsenter-skjema-soknadomdyrehold'),
  sporsmal('sak', 'Hvordan får jeg en sak behandlet av styret?',
    'Send saken skriftlig til styret@arnatveit-borettslag.no, minst én uke før oppsatt styremøte.',
    'Om oss og kontakt', 'side-om-borettslaget'),
  sporsmal('dugnad-betaling', 'Hva får jeg betalt for dugnad?',
    '150 kr per time for voksne og barn over 13 år, og 50 kr per time for barn mellom 7 og 13 år. Dugnaden utbetales én gang i året.',
    'Les om dugnad', 'side-dugnad'),
  sporsmal('dugnadsliste', 'Hvor leverer jeg dugnadslisten?',
    'I borettslagets postkasse i A-tunet.',
    'Last ned dugnadslisten', 'dokument-dugnad-dugnadskort1side-201104-2'),
  sporsmal('ark', 'Skal jeg bygge ark eller tilbygg?',
    'Følg veiledningen steg for steg i dokumentsenteret, og send søknad til styret før du starter arbeidet.',
    'Se veiledningen', 'oppgave-bygg'),
];

const side = (_key, id, tekst) => ({ _type: 'gruppeside', _key, side: ref(id), tekst });
export const SEKSJONER = [
  {
    _type: 'undersider', _key: 'undersider', bredde: 'bred',
    grupper: [
      {
        _type: 'gruppe', _key: 'styring', tittel: 'Styring og regler', ingress: 'Hvordan borettslaget drives, og hvem som bestemmer.',
        sider: [
          side('gf', 'side-generalforsamling', 'Borettslagets øverste organ. Innkallinger og protokoller.'),
          side('vedtekter', 'side-vedtekter', 'Vedtekter, husordensregler og borettslagsloven.'),
          side('styret', 'side-styret', 'Hvem som sitter i styret, og hvem du kontakter for hva.'),
        ],
      },
      {
        _type: 'gruppe', _key: 'fellesskap', tittel: 'Fellesskap', ingress: 'Det vi gjør sammen, og hvordan du holder deg oppdatert.',
        sider: [
          side('dugnad', 'side-dugnad', 'Felles innsats som holder kostnadene nede. Du får betalt.'),
          side('miljo', 'side-miljoutvalget', 'Sosiale arrangementer for store og små i alle tre tun.'),
          side('abc', 'side-abc-nytt', 'Informasjonsbladet, rundt seks ganger i året.'),
        ],
      },
    ],
  },
  {
    _type: 'sporsmal', _key: 'sporsmal', tittel: 'Vanlige spørsmål', ingress: 'Raske svar på det beboere oftest lurer på.',
    sporsmal: SPORSMAL.map((s) => ({ ...ref(s._id), _key: s._id.replace('sporsmal-', '') })),
  },
  {
    _type: 'oppfordring', _key: 'fant-du', bredde: 'bred', utenIkon: true,
    tittel: 'Fant du ikke det du lette etter?', tekst: 'Spør styret, så hjelper vi deg.', knapp: 'Kontakt styret',
    lenke: lenke('Dokumentsenter', 'side-dokumentsenter'),
  },
];
