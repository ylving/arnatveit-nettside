// Aktuelt, shared by the dataset migrations (aktuelt.mjs, nyheter-blokker.mjs) and the import (content.mjs): the news
// categories (editable documents), the general assembly news item's blocks, and the menu item's text.
import { tilSeksjoner } from './seksjoner-lib.mjs';
export const MENY = { fra: 'Nytt', til: 'Aktuelt' };

const kategori = (verdi, tittel, farge, ikon) => ({ _id: `nyhetskategori-${verdi}`, _type: 'nyhetskategori', tittel, farge, ikon });
export const KATEGORIER = [
  kategori('generalforsamling', 'Generalforsamling', 'gronn', 'Gavel'),
  kategori('dugnad', 'Dugnad', 'gronn', 'Sprout'),
  kategori('styret', 'Styret', 'blaa', 'Users'),
  kategori('informasjon', 'Informasjon', 'sand', 'Info'),
  kategori('sosialt', 'Sosialt', 'sand', 'Heart'),
];
export const kategoriRef = (verdi) => ({ _type: 'reference', _ref: `nyhetskategori-${verdi}` });

const dagFmt = new Intl.DateTimeFormat('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/** "2026-05-28" → "Torsdag 28. mai 2026" */
export const langDato = (iso) => { const t = dagFmt.format(new Date(`${iso}T12:00:00`)); return t.charAt(0).toUpperCase() + t.slice(1); };

/** Fact box block from date and place */
export const faktaboks = ({ dato, sted }) => ({
  _type: 'faktaboks', _key: 'fakta',
  rader: [
    ...(dato ? [{ _type: 'fakta', _key: 'dato', ikon: 'CalendarDays', etikett: 'Dato', verdi: langDato(dato) }] : []),
    ...(sted ? [{ _type: 'fakta', _key: 'sted', ikon: 'MapPin', etikett: 'Sted', verdi: sted }] : []),
  ],
});
/** Link rows block with one link */
export const relatert = ({ side, tittel, tekst }) => ({ _type: 'relatert', _key: 'relatert', lenker: [{ _type: 'relatertLenke', _key: 'lenke', side, ...(tittel && { tittel }), ...(tekst && { tekst }) }] });

export const GF_2026 = {
  kategori: 'generalforsamling',
  fakta: { dato: '2026-05-28', sted: 'Arna Misjonsmenighet' },
  // The design says "fra 2017"; the protocols in the dataset go back to 2011
  relatert: { side: { _type: 'reference', _ref: 'side-generalforsamling' }, tittel: 'Alle protokoller', tekst: 'Generalforsamlinger fra 2011 til i dag' },
};

/** A news item's category from its old free-text tag (aktuelt.mjs, already run): "Generalforsamling 2026" → generalforsamling */
export const kategoriFraMerkelapp = (merkelapp = '') =>
  ['generalforsamling', 'dugnad', 'styret'].find((k) => merkelapp.toLowerCase().startsWith(k)) ?? 'informasjon';

/** An old-shape news item (kategori string, innhold, fakta, relatert) → { kategori reference, seksjoner } */
export function tilBlokker(n) {
  const kjente = KATEGORIER.map((k) => k._id.replace('nyhetskategori-', ''));
  const verdi = typeof n.kategori === 'string' && kjente.includes(n.kategori) ? n.kategori : 'informasjon';
  const fakta = n.fakta && (n.fakta.dato || n.fakta.sted) ? [faktaboks(n.fakta)] : [];
  const lenke = n.relatert?.side ? [relatert(n.relatert)] : [];
  return { kategori: n.kategori?._ref ? n.kategori : kategoriRef(verdi), seksjoner: [...fakta, ...tilSeksjoner(n.innhold ?? []), ...lenke] };
}

const MANEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
/** "Torsdag 28. mai 2026" → "2026-05-28" (undefined if it doesn't parse) */
export const fraLangDato = (tekst = '') => {
  const m = tekst.toLowerCase().match(/(\d{1,2})\.\s*([a-zæøå]+)\s+(\d{4})/);
  const mnd = m && MANEDER.indexOf(m[2]) + 1;
  return mnd ? `${m[3]}-${String(mnd).padStart(2, '0')}-${m[1].padStart(2, '0')}` : undefined;
};
/** A fact box holding only "Dato"/"Sted" rows → { dato, sted } for the header fields; anything else → null (left as is) */
export const faktaFraBlokk = (blokk) => {
  const rader = blokk?._type === 'faktaboks' ? blokk.rader ?? [] : [];
  if (!rader.length || !rader.every((r) => ['Dato', 'Sted'].includes(r.etikett))) return null;
  const dato = rader.find((r) => r.etikett === 'Dato');
  const sted = rader.find((r) => r.etikett === 'Sted')?.verdi;
  const iso = dato && fraLangDato(dato.verdi);
  if (dato && !iso) return null;
  return { ...(iso && { dato: iso }), ...(sted && { sted }) };
};
