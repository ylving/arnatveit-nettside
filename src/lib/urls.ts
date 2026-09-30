export type DocRef = { _type: string; slug?: string; forelder?: string | null; fil?: string } | null | undefined;
export type Link = { tekst?: string; url?: string; intern?: DocRef } | null | undefined;

export function docHref(d: DocRef): string | undefined {
  if (!d) return undefined;
  if (d._type === 'side') return d.forelder ? `/${d.forelder}/${d.slug}` : `/${d.slug}`;
  if (d._type === 'nyhet') return `/aktuelt/${d.slug}`;
  if (d._type === 'dokument' || d._type === 'abcUtgave') return d.fil;
  return undefined;
}

// The page's public path. In static builds Astro.url.pathname ends in ".html" (build.format: 'file'),
// while the site is served without it: /kontakt.html → /kontakt, /index.html → /
export const pagePath = (url: URL) => url.pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';

export const linkHref = (l: Link) => (l?.intern ? docHref(l.intern) : l?.url);

const dateFmt = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDate = (iso?: string) => (iso ? dateFmt.format(new Date(`${iso}T12:00:00`)) : '');

export const formatSize = (bytes?: number) =>
  !bytes ? '' : bytes < 950_000 ? `${Math.max(1, Math.round(bytes / 1e3))} kB` : `${(bytes / 1e6).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} MB`;
