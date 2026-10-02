// Defaults used when a setting in Innstillinger is left empty (shared by Studio and site)
export const MENY_BRYTEPUNKT = 1080;
// Icon shown on a child page's card when none is chosen (a Lucide icon name)
export const STANDARD_IKON = 'FileText';
// Default width per page section type when `bredde` is not set: tekst = text column (72ch), breakout = between
// text and wide (--breakout, 960px), bred = content container
export const STANDARD_BREDDE = {
  bilde: 'tekst',
  dokumentliste: 'tekst',
  nokkeltall: 'breakout',
  medlemsliste: 'bred',
  kontaktinfo: 'bred',
  undersider: 'bred',
  ansvarsliste: 'bred',
  arrangementer: 'breakout',
  oppgaver: 'bred',
  abcUtgaver: 'bred',
  borettslagsfakta: 'bred',
  punkter: 'bred',
  oppfordring: 'bred',
  generalforsamlinger: 'bred',
  regelverk: 'bred',
  nivaaer: 'bred',
  relatert: 'tekst',
} as const;
export type Bredde = 'tekst' | 'breakout' | 'bred' | 'full';
// Event categories (arrangement.kategori). Colours are tokens in global.css (--dugnad*, --sosialt*).
export const KATEGORIER = [
  { verdi: 'dugnad', navn: 'Dugnad', ikon: 'Sprout' },
  { verdi: 'sosialt', navn: 'Sosialt', ikon: 'Heart' },
] as const;
export type Kategori = (typeof KATEGORIER)[number]['verdi'];
// Tints for document categories and task cards (dokumentkategori.farge, oppgave.aksent). Colours are tokens in global.css (--farge-<verdi>*).
export const FARGER = [
  { verdi: 'oker', navn: 'Oker (søknader)' },
  { verdi: 'gronn', navn: 'Grønn (bygging)' },
  { verdi: 'blaa', navn: 'Blå (HMS)' },
  { verdi: 'sand', navn: 'Sand (skjemaer)' },
] as const;
export type Farge = (typeof FARGER)[number]['verdi'];
export const STANDARD_FARGE: Farge = 'gronn';
// Tun a document or event can belong to (dokument.tun). "Felles" = shared areas.
export const TUN = ['A-tunet', 'B-tunet', 'C-tunet', 'Felles'] as const;
// Icons for the "Jeg vil …" task cards (oppgave.ikon), Lucide names
export const OPPGAVE_IKONER = [
  { verdi: 'House', navn: 'Hus' },
  { verdi: 'Key', navn: 'Nøkkel' },
  { verdi: 'PawPrint', navn: 'Pote' },
  { verdi: 'AirVent', navn: 'Varmepumpe' },
  { verdi: 'Wrench', navn: 'Verktøy' },
  { verdi: 'FileText', navn: 'Dokument' },
] as const;
export const MAANEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'] as const;
const stor = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** ABC-nytt issue name: (3, 2026) → "Mars 2026" */
export const utgaveNavn = (maaned?: number, aar?: number) => [maaned && stor(MAANEDER[maaned - 1] ?? ''), aar].filter(Boolean).join(' ');
// General assemblies (generalforsamling.type). Extraordinary ones get the ochre tint in document rows.
export const GF_TYPER = [
  { verdi: 'ordinaer', navn: 'Ordinær' },
  { verdi: 'ekstraordinaer', navn: 'Ekstraordinær' },
] as const;
/** "Generalforsamling 2026" / "Ekstraordinær generalforsamling 2017" */
export const gfNavn = (type?: string, dato?: string) =>
  `${type === 'ekstraordinaer' ? 'Ekstraordinær generalforsamling' : 'Generalforsamling'}${dato ? ` ${dato.slice(0, 4)}` : ''}`;
// News item without a category (shouldn't happen, the field is required): pill and drawing fall back to this
export const STANDARD_NYHETSKATEGORI = { tittel: 'Informasjon', farge: 'sand', ikon: 'Info' } as const;
// News per listing page (/aktuelt, /aktuelt/side/2 …)
export const NYHETER_PER_SIDE = 20;
// Sections the page head's jump links («Vis snarveier øverst») can point to (seksjonAnker in src/lib/urls.ts)
export const SNARVEI_TYPER = ['kontaktinfo', 'fargebaand', 'borettslagsfakta'] as const;
