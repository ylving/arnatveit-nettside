// Pure logic for "auto-redirect when a page moves" (kept free of React/Sanity so it can be tested)

type Ref = { _ref?: string } | undefined;
export type SideUtkast = { slug?: { current?: string }; forelder?: Ref; gamleUrler?: string[] } | null | undefined;

/** A page's public path, given its parent's slug (pages are at most one level deep). */
export function sti(side: SideUtkast, forelderSlug?: string | null): string | null {
  const slug = side?.slug?.current;
  if (!slug) return null;
  return forelderSlug ? `/${forelderSlug}/${slug}` : `/${slug}`;
}

/**
 * New value for `gamleUrler` when a page is published, or null if nothing changes.
 * - moved (live path ≠ new path): add the live path so the next build redirects it
 * - moved back to an earlier path: drop that path, so a page never redirects to itself
 */
export function nyeGamleUrler(livSti: string | null, nySti: string | null, eksisterende: string[] = []): string[] | null {
  if (!livSti || !nySti) return null;
  let liste = eksisterende.filter((u) => u !== nySti);
  if (livSti !== nySti && !liste.includes(livSti)) liste = [...liste, livSti];
  const uendret = liste.length === eksisterende.length && liste.every((u, i) => u === eksisterende[i]);
  return uendret ? null : liste;
}
