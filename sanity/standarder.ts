// Defaults used when a setting in Innstillinger is left empty (shared by Studio and site)
export const MENY_BRYTEPUNKT = 1080;
// Icon shown on a child page's card when none is chosen (a Lucide icon name)
export const STANDARD_IKON = 'FileText';
// Default width per page section type when `bredde` is not set: tekst = text column (72ch), bred = content container
export const STANDARD_BREDDE = {
  bilde: 'tekst',
  dokumentliste: 'tekst',
  faktaliste: 'tekst',
  nokkeltall: 'bred',
  knapper: 'tekst',
  medlemsliste: 'bred',
  kontaktinfo: 'bred',
  undersider: 'bred',
  ansvarsliste: 'bred',
  arrangementer: 'bred',
  oppgaver: 'bred',
  dokumentsok: 'bred',
  abcUtgaver: 'bred',
  borettslagsfakta: 'bred',
} as const;
export type Bredde = 'tekst' | 'bred' | 'full';
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
