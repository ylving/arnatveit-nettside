/** Initials as in the design: first letter of the first two names ("Stian A. Persson" → "SA", "Gro Helen Andersen" → "GH") */
export const initialer = (navn = '') =>
  navn.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();

export const telLenke = (t: string) => `tel:+47${t.replace(/\s/g, '')}`;
