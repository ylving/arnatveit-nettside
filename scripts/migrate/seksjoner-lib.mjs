// innhold (one rich text array) → seksjoner (list of sections). Pure; shared by the dataset
// migration (seksjoner.mjs) and the import (content.mjs).
//  - consecutive text blocks → one `tekst` section (key derived from the first block)
//  - every custom block → its own section, data and _key unchanged (lenkeknapp → knapper)
//  - pages with child pages get an `undersider` section first (where the cards used to render)
export function tilSeksjoner(innhold = [], harBarn = false) {
  const seksjoner = harBarn ? [{ _type: 'undersider', _key: 'undersider' }] : [];
  for (const b of innhold) {
    if (b._type === 'block') {
      const forrige = seksjoner.at(-1);
      if (forrige?._type === 'tekst' && forrige._fraBlokker) forrige.innhold.push(b);
      else seksjoner.push({ _type: 'tekst', _key: `t${b._key}`, innhold: [b], _fraBlokker: true });
    } else if (b._type === 'lenkeknapp') {
      seksjoner.push({ _type: 'knapper', _key: b._key, lenker: b.lenke ? [{ ...b.lenke, _key: `${b._key}-0` }] : [] });
    } else {
      seksjoner.push(b);
    }
  }
  return seksjoner.map(({ _fraBlokker, ...s }) => s);
}

/** "tekst → dokumentliste → …" for dry-run output */
export const oversikt = (seksjoner) => seksjoner.map((s) => s._type).join(' → ') || '(tom)';
