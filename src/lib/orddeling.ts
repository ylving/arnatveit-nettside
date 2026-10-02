// Word breaks in large titles, the Norwegian way: compounds split where their parts meet ("general-forsamling"), not by
// syllables as the browser's automatic hyphenation does ("generalforsam-ling"). Titles that use this have
// `hyphens: manual`, so they only break at these soft hyphens (or, as a last resort on narrow screens, anywhere).
// Add words here as they turn up. "|" marks a break; a trailing "|" means "after this part, if the word goes on".
const DELER = [
  'general|forsamling', 'ekstra|ordinær', 'bo|retts|lag', 'andels|eier', 'beboer|', 'felles|',
  'vedlike|holds|', 'hus|ordens|regler', 'ved|tekts|', 'dugnads|', 'styre|', 'informasjons|', 'miljø|utvalg',
  'dokument|senter', 'parkerings|', 'avfalls|', 'leke|plass', 'kamera|', 'skilt|gjen|kjenning', 'forsamlings|',
];
const SHY = '\u00AD';
const REGLER = DELER.map((d) => ({ ord: d.replaceAll('|', ''), brudd: [...d].reduce<number[]>((acc, c, i) => (c === '|' ? [...acc, i - acc.length] : acc), []) }));

/** Inserts soft hyphens at known compound boundaries (at least 3 letters on each side of a break) */
export function orddel(tekst = ''): string {
  return tekst.replace(/\p{L}{6,}/gu, (ord) => {
    const lav = ord.toLowerCase();
    const punkter = new Set<number>();
    for (const { ord: del, brudd } of REGLER) {
      for (let i = lav.indexOf(del); i !== -1; i = lav.indexOf(del, i + 1)) {
        for (const b of brudd) if (i + b >= 3 && ord.length - (i + b) >= 3) punkter.add(i + b);
      }
    }
    if (!punkter.size) return ord;
    return [...ord].map((c, i) => (punkter.has(i) ? SHY + c : c)).join('');
  });
}
