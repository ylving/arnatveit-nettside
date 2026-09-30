export type DocRef = { _type: string; slug?: string; forelder?: string | null; fil?: string } | null | undefined;
export type Link = { tekst?: string; url?: string; intern?: DocRef } | null | undefined;

export function docHref(d: DocRef): string | undefined {
  if (!d) return undefined;
  if (d._type === 'side') return d.forelder ? `/${d.forelder}/${d.slug}` : `/${d.slug}`;
  if (d._type === 'nyhet') return `/aktuelt/${d.slug}`;
  if (d._type === 'dokument' || d._type === 'abcUtgave' || d._type === 'generalforsamling') return d.fil;
  return undefined;
}

// The page's public path. In static builds Astro.url.pathname ends in ".html" (build.format: 'file'),
// while the site is served without it: /kontakt.html → /kontakt, /index.html → /
export const pagePath = (url: URL) => url.pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';

export const linkHref = (l: Link) => (l?.intern ? docHref(l.intern) : l?.url);

/** Anchor of a "Jeg vil …" task on its page: "oppgave-bygg". Opening the page with it opens that task's steps. */
export const oppgaveAnker = (id: string) => (id.startsWith('oppgave-') ? id : `oppgave-${id}`);

const dateFmt = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDate = (iso?: string) => (iso ? dateFmt.format(new Date(`${iso}T12:00:00`)) : '');

export const formatSize = (bytes?: number) =>
  !bytes ? '' : bytes < 950_000 ? `${Math.max(1, Math.round(bytes / 1e3))} kB` : `${(bytes / 1e6).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} MB`;

/** Section id from its heading, for jump links: "Området" → "omradet", "Kontakt" → "kontakt" */
export const ankerId = (tekst = '') =>
  tekst.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Sections that can be jumped to from the page head ("Vis snarveier øverst"): their label and id */
export function seksjonAnker(s: { _type: string; tittel?: string; overtittel?: string }): { tekst: string; id: string } | null {
  const tekst = s._type === 'fargebaand' ? s.overtittel || s.tittel : s._type === 'kontaktinfo' || s._type === 'borettslagsfakta' ? s.tittel : undefined;
  return tekst ? { tekst, id: ankerId(tekst) } : null;
}
