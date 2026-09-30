// Shared by every document list (DokumentRad, Dokumentliste, Dokumentsok)
import { formatSize } from './urls';

export type Dokument = {
  _id: string; tittel: string; dato?: string; beskrivelse?: string; tun?: string; rekkefolge?: number;
  url: string; size?: number; ext?: string; filnavn?: string; kategori?: { farge?: string; ikon?: string };
};
export type Sortering = 'dato' | 'tittel' | 'rekkefolge' | undefined;

const tittel = (a: Dokument, b: Dokument) => a.tittel.localeCompare(b.tittel, 'nb');

export function sorter(docs: Dokument[] = [], sortering: Sortering) {
  const f =
    sortering === 'tittel' ? tittel
    : sortering === 'rekkefolge' ? (a: Dokument, b: Dokument) => (a.rekkefolge ?? Infinity) - (b.rekkefolge ?? Infinity) || tittel(a, b)
    : (a: Dokument, b: Dokument) => (b.dato ?? '').localeCompare(a.dato ?? '') || tittel(a, b);
  return [...docs].sort(f);
}

/** "PDF · 37 kB", from the Sanity asset */
export const filInfo = (d: Pick<Dokument, 'ext' | 'size'>) => [(d.ext || 'pdf').toUpperCase(), formatSize(d.size)].filter(Boolean).join(' · ');

/** The file with Content-Disposition: attachment (the `download` attribute is ignored across origins) */
export const lastNedUrl = (d: Pick<Dokument, 'url' | 'filnavn'>) => `${d.url}?dl=${encodeURIComponent(d.filnavn ?? '')}`;
