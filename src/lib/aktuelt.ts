// Aktuelt (news): the posts query and the "I borettslaget nå" data
import { ABC_UTGAVE, DOC_REF, NYHET_KORT } from './queries';
import { ARRANGEMENTER, kommende, datoDeler, type Arrangement } from './arrangement';
import { load } from './sanity';

/** The featured post: the newest pinned one, else the newest. The rest keep their order. */
export const fremhevet = <T extends { festet?: boolean }>(liste: T[]): [T | undefined, T[]] => {
  const forste = liste.find((n) => n.festet) ?? liste[0];
  return [forste, liste.filter((n) => n !== forste)];
};

const kortFmt = new Intl.DateTimeFormat('nb-NO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Oslo' });
/** "2026-10-10" → "Lør 10. okt" (fact pills) */
export const kortDato = (iso: string) => {
  const t = kortFmt.format(new Date(`${iso}T12:00:00`)).replace(/\./g, '').replace(/(\d+) /, '$1. ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const NYHETER = `*[_type == "nyhet" && defined(slug.current)] | order(dato desc, _createdAt desc)${NYHET_KORT}`;

/** Everything "I borettslaget nå" needs: next event, newest ABC-nytt, the board's email and the pages it links to */
export async function lastModuler() {
  const d = await load<any>(`{
    "arrangementer": ${ARRANGEMENTER},
    "abc": *[_type == "abcUtgave" && defined(fil.asset)] | order(aar desc, maaned desc)[0]${ABC_UTGAVE},
    "epost": *[_id == "omBorettslaget"][0].epost,
    "dugnad": *[_id == "side-dugnad"][0]${DOC_REF},
    "abcSide": *[_id == "side-abc-nytt"][0]${DOC_REF}
  }`);
  const neste: Arrangement | undefined = kommende(d.arrangementer ?? [])[0];
  return { neste: neste && { ...neste, ...datoDeler(neste) }, abc: d.abc, epost: d.epost, dugnad: d.dugnad, abcSide: d.abcSide };
}
