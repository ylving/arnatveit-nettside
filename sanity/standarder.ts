// Defaults used when a setting in Innstillinger is left empty (shared by Studio and site)
export const MENY_BRYTEPUNKT = 1080;
// Icon shown on a child page's card when none is chosen (a Lucide icon name)
export const STANDARD_IKON = 'FileText';
// Default width per page section type when `bredde` is not set: tekst = text column (72ch), bred = content container
export const STANDARD_BREDDE = {
  bilde: 'tekst',
  dokumentliste: 'tekst',
  faktaliste: 'tekst',
  knapper: 'tekst',
  medlemsliste: 'bred',
  kontaktinfo: 'bred',
  undersider: 'bred',
  ansvarsliste: 'bred',
} as const;
export type Bredde = 'tekst' | 'bred' | 'full';
