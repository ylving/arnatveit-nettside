// Aktuelt (news): the listing's aside data and date parts shared by the listing and the article
import { ABC_UTGAVE, DOC_REF, NYHET_KORT } from './queries';
import { ARRANGEMENTER, kommende, datoDeler, type Arrangement } from './arrangement';
import { load } from './sanity';

const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
/** "2026-05-28" → { dag: "28", mnd: "mai", aar: "2026" } */
export const datoDel = (iso: string) => {
  const [aar, m, d] = iso.split('-');
  return { dag: String(+d), mnd: MND[+m - 1], aar };
};

export const NYHETER = `*[_type == "nyhet" && defined(slug.current)] | order(dato desc, _createdAt desc)${NYHET_KORT}`;

/** Everything the listing's aside needs: next event, newest ABC-nytt, the board's email and the pages it links to */
export async function lastAside() {
  const d = await load<any>(`{
    "arrangementer": ${ARRANGEMENTER},
    "abc": *[_type == "abcUtgave" && defined(fil.asset)] | order(aar desc, maaned desc)[0]${ABC_UTGAVE},
    "epost": *[_id == "omBorettslaget"][0].epost,
    "dugnad": *[_id == "side-dugnad"][0]${DOC_REF}
  }`);
  const neste: Arrangement | undefined = kommende(d.arrangementer ?? [])[0];
  return { neste: neste && { ...neste, ...datoDeler(neste) }, abc: d.abc, epost: d.epost, dugnad: d.dugnad };
}
