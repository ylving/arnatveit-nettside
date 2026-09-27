// GROQ projections shared across pages
export const DOC_REF = `{ _type, "slug": slug.current, seksjon, "fil": fil.asset->url }`;
export const LINK = `{ tekst, url, "intern": intern->${DOC_REF} }`;
export const DOKUMENT = `{ _id, tittel, dato, beskrivelse, "url": fil.asset->url, "size": fil.asset->size }`;

const MARKDEFS = `markDefs[]{ ..., _type == "link" => { "href": coalesce(intern->${DOC_REF}, href) } }`;

export const INNHOLD = `innhold[]{
  ...,
  _type == "block" => { ..., ${MARKDEFS} },
  _type == "infoboks" => { ..., tekst[]{ ..., ${MARKDEFS} } },
  _type == "lenkeknapp" => { "lenke": lenke${LINK} },
  _type == "medlemsliste" => { "utvalg": utvalg->{ navn, beskrivelse, medlemmer } },
  _type == "dokumentliste" => {
    ...,
    "kategori": kategori->{ tittel, sortering },
    "dokumenter": *[_type == "dokument" && kategori._ref == ^.kategori._ref] ${DOKUMENT}
  },
  _type == "bilde" => { ..., asset-> }
}`;

export const INNSTILLINGER = `*[_id == "innstillinger"][0]{
  navn, beskrivelse, kontakt, menyBrytepunkt,
  "hovedmeny": hovedmeny[]${LINK},
  banner{ aktiv, tekst, "lenke": lenke${LINK} },
  "praktiskInfo": *[_type == "side" && seksjon == "praktisk-info"] | order(rekkefolge asc){ tittel, "slug": slug.current, seksjon, _type }
}`;

export const SIDE_PATHS = `*[_type == "side" && defined(slug.current)]{ "slug": slug.current, seksjon }`;
export const SIDE = `*[_type == "side" && slug.current == $slug][0]{
  _id, tittel, ingress, seksjon, "slug": slug.current, seo, ${INNHOLD},
  "barn": select(slug.current == "praktisk-info" => *[_type == "side" && seksjon == "praktisk-info"] | order(rekkefolge asc){ _type, tittel, kort, ikon, "slug": slug.current, seksjon })
}`;
