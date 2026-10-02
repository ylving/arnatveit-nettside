// Live detail lines for the Praktisk info link rows (Undersider with groups), computed from Sanity at build time.
// Keyed by the pages' fixed ids; a page without a rule here simply gets no detail line. The dot colour is a token
// (the item's category colour).
import { load } from './sanity';
import { ARRANGEMENTER, kommende, type Arrangement } from './arrangement';
import { formatDate } from './urls';
import { utgaveNavn } from '../../sanity/standarder';

export type Detalj = { tekst: string; farge: string };

const dagFmt = new Intl.DateTimeFormat('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Oslo' });
/** "lørdag 10. oktober" */
const dag = (iso: string) => dagFmt.format(new Date(iso));

export async function lastDetaljer(): Promise<Record<string, Detalj>> {
  const d = await load<any>(`{
    "gf": *[_type == "generalforsamling" && defined(protokoll.asset) && !(_id in path("drafts.**"))] | order(dato desc, type asc)[0]{ dato },
    "regler": *[_id == "side-vedtekter"][0].seksjoner[_type == "regelverk"][0]{ "dok": dokumenter[]->tittel, lovUrl },
    "leder": array::compact(*[_id == "utvalg-styret"][0].medlemmer[rolle match "Styreleder*"])[0]{ navn, telefon },
    "arrangementer": ${ARRANGEMENTER},
    "abc": *[_type == "abcUtgave" && defined(fil.asset)] | order(aar desc, maaned desc)[0]{ maaned, aar }
  }`);
  const kom: Arrangement[] = kommende(d.arrangementer ?? []);
  const dugnad = kom.find((a) => a.kategori === 'dugnad');
  const sosialt = kom.find((a) => a.kategori === 'sosialt');
  const ut: Record<string, Detalj> = {};
  if (d.gf?.dato) {
    // 1 January = only the year is known
    ut['side-generalforsamling'] = { tekst: `Siste: ${d.gf.dato.endsWith('-01-01') ? d.gf.dato.slice(0, 4) : formatDate(d.gf.dato)} · protokoll lagt ut`, farge: 'var(--farge-gronn)' };
  }
  const regler = [...(d.regler?.dok ?? []).filter(Boolean), d.regler?.lovUrl && 'Loven'].filter(Boolean);
  if (regler.length) ut['side-vedtekter'] = { tekst: regler.join(' · '), farge: 'var(--faint)' };
  if (d.leder?.navn) ut['side-styret'] = { tekst: ['Styreleder ' + d.leder.navn, d.leder.telefon].filter(Boolean).join(' · '), farge: 'var(--farge-blaa)' };
  ut['side-dugnad'] = { tekst: dugnad ? `Neste: ${dag(dugnad.start)}` : 'Ingen dugnad planlagt ennå', farge: 'var(--dugnad)' };
  ut['side-miljoutvalget'] = { tekst: sosialt ? `Neste: ${sosialt.tittel} ${dag(sosialt.start).replace(/^\S+ /, '')}` : 'Ingen arrangementer planlagt ennå', farge: 'var(--sosialt)' };
  if (d.abc) ut['side-abc-nytt'] = { tekst: `Siste utgave: ${utgaveNavn(d.abc.maaned, d.abc.aar).toLowerCase()}`, farge: 'var(--farge-sand)' };
  return ut;
}
