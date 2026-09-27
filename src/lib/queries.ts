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
  _type == "bilde" => { ..., asset-> },
  // Members with areas of responsibility (all committees, or the one chosen on the section)
  _type == "ansvarsliste" => {
    ...,
    "utvalgMedAnsvar": *[_type == "utvalg" && (!defined(^.utvalg) || _id == ^.utvalg._ref)]{
      _id,
      "personer": medlemmer[count(ansvar) > 0]{ _key, navn, rolle, telefon, epost, "ansvar": ansvar[]{ omraade, beskrivelse, ikon } }
    }[count(personer) > 0]
  }
}`;

// Page builder sections (side.seksjoner); same dereferences as INNHOLD, at section level
export const SEKSJONER = `seksjoner[]{
  ...,
  _type == "tekst" => { ..., innhold[]{ ..., ${MARKDEFS} } },
  _type == "infoboks" => { ..., tekst[]{ ..., ${MARKDEFS} } },
  _type == "knapper" => { ..., "lenker": lenker[]${LINK} },
  _type == "medlemsliste" => { ..., "utvalg": utvalg->{ _id, navn, beskrivelse, medlemmer } },
  _type == "dokumentliste" => {
    ...,
    "kategori": kategori->{ tittel, sortering },
    "dokumenter": *[_type == "dokument" && kategori._ref == ^.kategori._ref] ${DOKUMENT}
  },
  _type == "bilde" => { ..., asset-> },
  // Members with areas of responsibility (all committees, or the one chosen on the section)
  _type == "ansvarsliste" => {
    ...,
    "utvalgMedAnsvar": *[_type == "utvalg" && (!defined(^.utvalg) || _id == ^.utvalg._ref)]{
      _id,
      "personer": medlemmer[count(ansvar) > 0]{ _key, navn, rolle, telefon, epost, "ansvar": ansvar[]{ omraade, beskrivelse, ikon } }
    }[count(personer) > 0]
  }
}`;

// Contact details from Innstillinger + the member toggled as "Kontaktperson" under Styre og utvalg
export const KONTAKT = `*[_id == "innstillinger"][0]{
  ...kontakt,
  "kontaktperson": array::compact(*[_type == "utvalg"].medlemmer[kontaktperson == true][0])[0]{ navn, rolle, telefon, epost }
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
  _id, tittel, ingress, kontaktboks, "slug": slug.current, seo, ${SEKSJONER},
  "forelder": forelder->{ tittel, "slug": slug.current },
  "barn": *[_type == "side" && forelder._ref == ^._id] | order(rekkefolge asc)${SIDE_KORT}
}`;
