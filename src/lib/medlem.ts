/** Initials as in the design: first letter of the first two names ("Stian A. Persson" → "SA", "Gro Helen Andersen" → "GH") */
export const initialer = (navn = '') =>
  navn.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();

export const telLenke = (t: string) => `tel:+47${t.replace(/\s/g, '')}`;

// Tun colours (the logo's greens). `kant` is the outline where the fill alone is too light to see.
export const TUN_FARGE: Record<string, string> = { 'A-tunet': '#7FA08F', 'B-tunet': '#2F5D4E', 'C-tunet': '#C3D6C9' };
export const TUN_KANT: Record<string, string> = { ...TUN_FARGE, 'C-tunet': '#8FB09C' };
