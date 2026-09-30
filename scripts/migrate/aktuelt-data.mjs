// Aktuelt per the design, shared by the dataset migration (aktuelt.mjs) and the import (content.mjs): the fields the
// general assembly news item gets, and the menu item's new text.
export const MENY = { fra: 'Nytt', til: 'Aktuelt' };

export const GF_2026 = {
  kategori: 'generalforsamling',
  fakta: { dato: '2026-05-28', sted: 'Arna Misjonsmenighet' },
  relatert: {
    side: { _type: 'reference', _ref: 'side-generalforsamling' },
    tittel: 'Alle protokoller',
    // The design says "fra 2017"; the protocols in the dataset go back to 2011
    tekst: 'Generalforsamlinger fra 2011 til i dag',
  },
};

/** A news item's category from its old free-text tag ("Generalforsamling 2026" → generalforsamling), else informasjon */
export const kategoriFraMerkelapp = (merkelapp = '') =>
  ['generalforsamling', 'dugnad', 'styret'].find((k) => merkelapp.toLowerCase().startsWith(k)) ?? 'informasjon';
