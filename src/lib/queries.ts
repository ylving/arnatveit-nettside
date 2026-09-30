// GROQ projections shared across pages
// `forelder` = parent page slug (pages are at most one level deep)
export const DOC_REF_FIELDS = `_type, "slug": slug.current, "forelder": forelder->slug.current, "fil": coalesce(fil.asset->url, protokoll.asset->url)`;
export const DOC_REF = `{ ${DOC_REF_FIELDS} }`;
export const SIDE_KORT = `{ ${DOC_REF_FIELDS}, tittel, kort, ikon }`;
export const LINK = `{ tekst, url, "intern": intern->${DOC_REF} }`;
// A general assembly's name, as gfNavn() in sanity/standarder.ts
const GF_TITTEL = `select(type == "ekstraordinaer" => "Ekstraordinær generalforsamling ", "Generalforsamling ") + string::split(dato, "-")[0]`;

// A document row. General assemblies (their protocol) get the same shape, so they can be attached to news too.
export const DOKUMENT = `{
  _id, dato, beskrivelse, tun, rekkefolge,
  _type == "generalforsamling" => {
    "tittel": ${GF_TITTEL},
    "url": protokoll.asset->url, "size": protokoll.asset->size, "ext": protokoll.asset->extension, "filnavn": protokoll.asset->originalFilename,
    "kategori": { "farge": select(type == "ekstraordinaer" => "oker", "gronn"), "ikon": "FileText" }
  },
  _type != "generalforsamling" => {
    tittel,
    "url": fil.asset->url, "size": fil.asset->size, "ext": fil.asset->extension, "filnavn": fil.asset->originalFilename,
    "kategori": kategori->{ farge, ikon }
  }
}`;

// A general assembly: its protocol as a document row, plus date, type, place and the optional invitation
export const GENERALFORSAMLING = `{
  ...${DOKUMENT}, type, sted,
  "innkalling": innkalling.asset->{ "url": url, "size": size, "ext": extension, "filnavn": originalFilename }
}`;

// An ABC-nytt issue, with its cover's size (for width/height on the image)
export const ABC_UTGAVE = `{
  _id, maaned, aar, "url": fil.asset->url, "size": fil.asset->size, "filnavn": fil.asset->originalFilename,
  "forside": forside.asset->{ url, "w": metadata.dimensions.width, "h": metadata.dimensions.height }
}`;

const MARKDEFS = `markDefs[]{ ..., _type == "link" => { "href": coalesce(intern->${DOC_REF}, href) } }`;

export const INNHOLD = `innhold[]{
  ...,
  _type == "block" => { ..., ${MARKDEFS} },
  _type == "bilde" => { ..., asset-> }
}`;

// Page builder sections (side.seksjoner); same dereferences as INNHOLD, at section level
export const SEKSJONER = `seksjoner[]{
  ...,
  _type == "tekst" => { ..., innhold[]{ ..., ${MARKDEFS} } },
  _type == "medlemsliste" => { ..., "utvalg": utvalg->{ _id, navn, beskrivelse, medlemmer } },
  // One group per category, in the editor's order (the search view shows them as groups, the list joins them)
  _type == "dokumentliste" => {
    ...,
    "grupper": kategorier[]->{ _id, tittel, "slug": slug.current, ingress, sortering, "dokumenter": *[_type == "dokument" && kategori._ref == ^._id] ${DOKUMENT} }
  },
  _type == "bilde" => { ..., asset-> },
  // Members with areas of responsibility (all committees, or the one chosen on the section)
  _type == "ansvarsliste" => {
    ...,
    "utvalgMedAnsvar": *[_type == "utvalg" && (!defined(^.utvalg) || _id == ^.utvalg._ref)]{
      _id,
      "personer": medlemmer[count(ansvar) > 0]{ _key, navn, rolle, telefon, epost, "ansvar": ansvar[]{ omraade, beskrivelse, ikon } }
    }[count(personer) > 0]
  },
  _type == "kontaktinfo" => { ..., "lenker": lenker[]{ _key, tittel, tekst, "side": side->${DOC_REF} } },
  _type == "oppgaver" => {
    ...,
    "oppgaver": oppgaver[]->{ _id, tittel, ikon, aksent, kontakttekst, kontaktEpost, "steg": steg[]{ _key, tekst, "dokumenter": dokumenter[]->${DOKUMENT} } }
  },
  _type == "generalforsamlinger" => {
    ...,
    // Same date (only the year known): the extraordinary one first, as in the design
    "moter": *[_type == "generalforsamling" && defined(protokoll.asset) && !(_id in path("drafts.**"))] | order(dato desc, type asc) ${GENERALFORSAMLING}
  },
  _type == "regelverk" => { ..., "dokumenter": dokumenter[]->${DOKUMENT} },
  _type == "relatert" => { ..., "lenker": lenker[]{ _key, tekst, "side": side->${SIDE_KORT} } },
  _type == "abcUtgaver" => {
    ...,
    "utgaver": *[_type == "abcUtgave" && defined(fil.asset)] | order(aar desc, maaned desc) ${ABC_UTGAVE},
    "redaktor": array::compact(*[_type == "utvalg" && !(_id in path("drafts.**"))].medlemmer[abcRedaktor == true])[0].navn
  }
}`;

// Contact details and facts from «Om borettslaget» + the member toggled as "Kontaktperson" under Styre og utvalg
export const KONTAKT = `*[_id == "omBorettslaget"][0]{
  ...,
  "kontaktperson": array::compact(*[_type == "utvalg"].medlemmer[kontaktperson == true][0])[0]{ navn, rolle, telefon, epost }
}`;

export const INNSTILLINGER = `*[_id == "innstillinger"][0]{
  navn, beskrivelse, menyBrytepunkt,
  "kontakt": *[_id == "omBorettslaget"][0]{ epost },
  "hovedmeny": hovedmeny[]${LINK},
  banner{
    aktiv, tekst, "lenke": lenke${LINK},
    // "Lenk til protokollen fra siste generalforsamling"
    sisteProtokoll == true => { "protokoll": *[_type == "generalforsamling" && defined(protokoll.asset) && !(_id in path("drafts.**"))] | order(dato desc, type asc)[0].protokoll.asset->url }
  },
  "praktiskInfo": *[_type == "side" && forelder._ref == "side-praktisk-info"] | order(rekkefolge asc)${SIDE_KORT},
  "dokumentsenter": *[_id == "side-dokumentsenter"][0]${DOC_REF},
  "omside": *[_id == "side-om-borettslaget"][0]${DOC_REF}
}`;

export const SIDE_PATHS = `*[_type == "side" && defined(slug.current)]{ "slug": slug.current, "forelder": forelder->slug.current }`;
export const SIDE = `*[_type == "side" && slug.current == $slug][0]{
  _id, tittel, overskrift, ingress, kontaktboks, snarveier, "slug": slug.current, seo, ${SEKSJONER},
  "forelder": forelder->{ tittel, "slug": slug.current },
  "barn": *[_type == "side" && forelder._ref == ^._id] | order(rekkefolge asc)${SIDE_KORT}
}`;
