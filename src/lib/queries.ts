// GROQ projections shared across pages
// `forelder` = parent page slug (pages are at most one level deep)
export const DOC_REF_FIELDS = `_type, "slug": slug.current, "forelder": forelder->slug.current, "fil": fil.asset->url`;
export const DOC_REF = `{ ${DOC_REF_FIELDS} }`;
export const SIDE_KORT = `{ ${DOC_REF_FIELDS}, tittel, kort, ikon }`;
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
  "praktiskInfo": *[_type == "side" && forelder._ref == "side-praktisk-info"] | order(rekkefolge asc)${SIDE_KORT},
  "dokumentsenter": *[_id == "side-dokumentsenter"][0]${DOC_REF},
  "kontaktside": *[_id == "side-kontakt"][0]${DOC_REF}
}`;

export const SIDE_PATHS = `*[_type == "side" && defined(slug.current)]{ "slug": slug.current, "forelder": forelder->slug.current }`;
export const SIDE = `*[_type == "side" && slug.current == $slug][0]{
  _id, tittel, ingress, "slug": slug.current, seo, ${INNHOLD},
  "forelder": forelder->{ tittel, "slug": slug.current },
  "barn": *[_type == "side" && forelder._ref == ^._id] | order(rekkefolge asc)${SIDE_KORT}
}`;
