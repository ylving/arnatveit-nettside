// Keeps Norwegian phone numbers (and "tlf" + number) on one line in free text, using non-breaking spaces.
const NBSP = '\u00A0';
const TELEFON = /(?<!\d)(?:\+47[ \u00A0])?(?:\d{3} \d{2} \d{3}|\d{2} \d{2} \d{2} \d{2})(?!\d)/g;

export const beskyttTelefon = (tekst: string) =>
  tekst
    .replace(TELEFON, (nr) => nr.replace(/ /g, NBSP))
    .replace(/\b(tlf|telefon|mob)(\.?) (?=\+?\d)/gi, `$1$2${NBSP}`);

type Blokk = { _type: string; children?: { _type: string; text?: string }[] };

/** Same, for every text span in Portable Text blocks */
export const beskyttTelefonIBlokker = <T extends Blokk>(blokker: T[] = []): T[] =>
  blokker.map((b) =>
    b._type === 'block' && b.children
      ? { ...b, children: b.children.map((c) => (c._type === 'span' && c.text ? { ...c, text: beskyttTelefon(c.text) } : c)) }
      : b,
  );
