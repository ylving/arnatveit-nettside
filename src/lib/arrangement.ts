// Events (`arrangement`): upcoming list, date parts for the page, and iCalendar (.ics) output.
// Times are stored in UTC (Sanity datetime) and shown in Norwegian time.
import type { Kategori } from '../../sanity/standarder';

export type Arrangement = {
  _id: string;
  _updatedAt: string;
  tittel: string;
  kategori: Kategori;
  start: string;
  slutt?: string;
  sted?: string;
  tun?: string;
  beskrivelse?: string;
};

const SONE = 'Europe/Oslo';

// Everything from the day before yesterday; `kommende()` does the exact cut in Norwegian time
export const ARRANGEMENTER = `*[_type == "arrangement" && defined(start) && defined(kategori) && dateTime(start) > dateTime(now()) - 60*60*48]
  | order(start asc){ _id, _updatedAt, tittel, kategori, start, slutt, sted, tun, beskrivelse }`;

const datoFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: SONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const klokkeFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: SONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const ukedagFmt = new Intl.DateTimeFormat('en-US', { timeZone: SONE, weekday: 'short' });

/** "2026-10-10" in Norwegian time */
const osloDato = (d: Date) => datoFmt.format(d);

/** Events from today on (Norwegian date): today's event stays up all day, until the nightly rebuild. */
export const kommende = (liste: Arrangement[], naa = new Date()) => {
  const idag = osloDato(naa);
  return liste.filter((a) => osloDato(new Date(a.start)) >= idag);
};

const MND = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
const UKEDAG: Record<string, string> = { Mon: 'Man', Tue: 'Tir', Wed: 'Ons', Thu: 'Tor', Fri: 'Fre', Sat: 'Lør', Sun: 'Søn' };

/** "14.00" / "14:00" → "14:00"; anything else → undefined */
const klokkeslett = (t?: string) => {
  const m = t?.trim().match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : undefined;
};

/** End as a Date: the start's day at the `slutt` time (Norwegian). Undefined if missing or not after the start. */
export function sluttTid(a: Arrangement): Date | undefined {
  const s = klokkeslett(a.slutt);
  if (!s) return undefined;
  const start = new Date(a.start);
  const [h, m] = klokkeFmt.format(start).split(':').map(Number);
  const diff = (+s.slice(0, 2) * 60 + +s.slice(3)) - (h * 60 + m);
  return diff > 0 ? new Date(start.getTime() + diff * 60_000) : undefined;
}

/** Everything the page shows about the date */
export function datoDeler(a: Arrangement) {
  const start = new Date(a.start);
  const [aar, mnd, dag] = osloDato(start).split('-');
  const slutt = sluttTid(a);
  return {
    maanedNokkel: `${aar}-${mnd}`,
    maaned: `${MND[+mnd - 1]} ${aar}`,
    ukedag: UKEDAG[ukedagFmt.format(start)],
    dag: String(+dag),
    mnd: MND[+mnd - 1].slice(0, 3),
    tid: `${klokkeFmt.format(start)}${slutt ? `–${klokkeFmt.format(slutt)}` : ''}`,
  };
}

/** File name for the event's own .ics: date + title, e.g. "2026-10-10-hostdugnad" */
export const filnavn = (a: Arrangement) => {
  const tittel = a.tittel.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${osloDato(new Date(a.start))}-${tittel || 'arrangement'}`;
};

/** Unique file names for a list (a second event with the same date and title gets part of its id) */
export const filnavnFor = (liste: Arrangement[]) => {
  const brukt = new Set<string>();
  return new Map(liste.map((a) => {
    let navn = filnavn(a);
    if (brukt.has(navn)) navn = `${navn}-${a._id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
    brukt.add(navn);
    return [a._id, navn];
  }));
};

// ---- iCalendar (RFC 5545) ----

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets (continuation lines start with a space) */
function fold(linje: string) {
  const enc = new TextEncoder();
  const deler: string[] = [];
  let del = '';
  for (const tegn of linje) {
    if (enc.encode(del + tegn).length > (deler.length ? 74 : 75)) { deler.push(del); del = ''; }
    del += tegn;
  }
  deler.push(del);
  return deler.join('\r\n ');
}

const KATEGORINAVN: Record<Kategori, string> = { dugnad: 'Dugnad', sosialt: 'Sosialt' };

function vevent(a: Arrangement, domene: string) {
  const slutt = sluttTid(a);
  const sted = [a.sted, a.tun && !a.sted?.includes(a.tun) ? a.tun : undefined].filter(Boolean).join(', ');
  return [
    'BEGIN:VEVENT',
    `UID:${a._id}@${domene}`,
    `DTSTAMP:${utc(new Date(a._updatedAt))}`,
    `DTSTART:${utc(new Date(a.start))}`,
    slutt && `DTEND:${utc(slutt)}`,
    `SUMMARY:${esc(a.tittel)}`,
    sted && `LOCATION:${esc(sted)}`,
    a.beskrivelse && `DESCRIPTION:${esc(a.beskrivelse)}`,
    `CATEGORIES:${KATEGORINAVN[a.kategori]}`,
    'END:VEVENT',
  ].filter(Boolean) as string[];
}

/** A VCALENDAR with the given events. `feed` adds the subscription name and refresh hints. */
export function ics(liste: Arrangement[], { site, navn, feed = false }: { site: URL; navn: string; feed?: boolean }) {
  const linjer = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${navn}//Nettside//NO`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(feed ? [`X-WR-CALNAME:${esc(navn)}`, `X-WR-TIMEZONE:${SONE}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H'] : []),
    ...liste.flatMap((a) => vevent(a, site.hostname.replace(/^www\./, ''))),
    'END:VCALENDAR',
  ];
  return new Response(linjer.map(fold).join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
}
