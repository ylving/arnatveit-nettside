// Generalforsamling content per the design, shared by the dataset migration (generalforsamling.mjs) and the import
// (content.mjs, run.mjs): how a protocol becomes a `generalforsamling`, the page ingress and its first three sections.

/** A protocol document (title "Generalforsamling 2017" / "Ekstraordinær generalforsamling 2017", date) → generalforsamling */
export function tilGeneralforsamling({ tittel, dato, gamleUrler }) {
  const type = /^ekstraordinær/i.test(tittel) ? 'ekstraordinaer' : 'ordinaer';
  return {
    _id: `gf-${dato.slice(0, 4)}${type === 'ekstraordinaer' ? '-ekstraordinaer' : ''}`, _type: 'generalforsamling', dato, type,
    ...(dato === '2026-05-28' && { sted: 'Arna Misjonsmenighet' }),
    ...(gamleUrler?.length && { gamleUrler }),
  };
}

export const INGRESS = 'Generalforsamlingen er borettslagets øverste organ, og består av alle andelseierne. Den holdes hvert år, og det er her styret velges.';

const punkt = (_key, ikon, tittel, tekst) => ({ _type: 'punkt', _key, ikon, tittel, tekst });
export const SEKSJONER = [
  {
    _type: 'punkter', _key: 'slik', tittel: 'Slik fungerer det', bredde: 'bred',
    punkter: [
      punkt('organ', 'Users', 'Øverste organ', 'Alle andelseiere kan møte og stemme. Styret kaller inn etter vedtektene og borettslagsloven.'),
      punkt('styret', 'ClipboardCheck', 'Velger styret', 'Styret har representanter fra alle tre tun, pluss ett eksternt styremedlem.'),
      punkt('valg', 'Search', 'Valgkomiteen', 'Finner kandidater til styret før hvert valg. Den har én representant fra hvert tun.'),
      punkt('ekstra', 'TriangleAlert', 'Ekstraordinær generalforsamling', 'Behandler én enkeltsak. Holdes når styret mener det trengs, eller når revisor eller minst to andelseiere med til sammen 1/10 av stemmene krever det.'),
    ],
  },
  {
    _type: 'oppfordring', _key: 'sak', tittel: 'Vil du melde inn en sak?', bredde: 'bred',
    tekst: 'Alle andelseiere kan få en sak behandlet. Send den skriftlig til styret. Fristen varsles før møtet.',
    knapp: 'Send sak til styret', emne: 'Sak til generalforsamlingen',
  },
  {
    _type: 'generalforsamlinger', _key: 'protokoller', tittel: 'Protokoller', ingress: 'Protokoll fra hver generalforsamling, nyeste først', bredde: 'bred',
    neste: 'Ordinær generalforsamling våren 2027. Innkallingen sendes til alle andelseiere.',
  },
];
