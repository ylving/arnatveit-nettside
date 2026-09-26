export type DocRef = { _type: string; slug?: string; seksjon?: string; fil?: string } | null | undefined;
export type Link = { tekst?: string; url?: string; intern?: DocRef } | null | undefined;

export function docHref(d: DocRef): string | undefined {
  if (!d) return undefined;
  if (d._type === 'side') return d.seksjon === 'praktisk-info' ? `/praktisk-info/${d.slug}` : `/${d.slug}`;
  if (d._type === 'nyhet') return `/aktuelt/${d.slug}`;
  if (d._type === 'dokument') return d.fil;
  return undefined;
}

export const linkHref = (l: Link) => (l?.intern ? docHref(l.intern) : l?.url);

const dateFmt = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDate = (iso?: string) => (iso ? dateFmt.format(new Date(`${iso}T12:00:00`)) : '');

export const formatSize = (bytes?: number) => (bytes ? `${(bytes / 1e6).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} MB` : '');
