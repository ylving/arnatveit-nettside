// Icons: Lucide (https://lucide.dev, ISC licence). `side.ikon` stores a Lucide export name, e.g. "Users".
// Used by the Studio picker and by the site (rendered to inline SVG at build time, no client JS).
import { icons } from 'lucide';
import { STANDARD_IKON } from './standarder';

export type IkonNode = [tag: string, attrs: Record<string, string | number>][];

const alle = icons as unknown as Record<string, IkonNode>;

export const erIkon = (navn?: string): navn is string => !!navn && navn in alle;

/** The icon's SVG child nodes; unknown or empty names fall back to the default icon. */
export const ikonNode = (navn?: string): IkonNode => (erIkon(navn) ? alle[navn] : alle[STANDARD_IKON]);

/** One name per distinct icon (Lucide lists aliases like Home/House as the same object), sorted. */
export const ikonNavn: string[] = (() => {
  const seen = new Map<IkonNode, string>();
  for (const [navn, node] of Object.entries(alle)) if (!seen.has(node)) seen.set(node, navn);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
})();

/** "FileText" → "file text" (for display and search) */
export const lesbartNavn = (navn: string) => navn.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Za-z]{2,})(\d)/g, '$1 $2').toLowerCase();
