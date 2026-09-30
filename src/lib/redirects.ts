// Builds Cloudflare `_redirects` lines. Pure, so collisions can be tested without Sanity.
export type RedirectKilde = { til: string; gamleUrler: string[]; harBarn: boolean };

// Paths contain spaces etc. — Cloudflare matches the percent-encoded request path.
const enc = (p: string) => encodeURI(p);

/**
 * @param kilder   pages/documents with old addresses, most recently updated first
 * @param levende  addresses where a page/article lives now. Cloudflare applies redirects BEFORE
 *                 serving a page, so an old address that is live again must not be redirected.
 */
export function lagRedirects(kilder: RedirectKilde[], levende: Set<string>): string[] {
  const linjer: string[] = [];
  const splats: string[] = [];
  const brukt = new Set<string>();
  for (const { til: side, gamleUrler, harBarn } of kilder) {
    for (const adresse of gamleUrler) {
      // "/kontakt#kontakt": the old address goes to a section of this page (merged pages)
      const [fra, anker] = adresse.split('#');
      const til = anker ? `${side}#${anker}` : side;
      if (fra === side && !anker) continue;
      if (levende.has(fra)) { linjer.push(`# skipped ${enc(fra)}: a page lives there now`); continue; }
      if (brukt.has(fra)) continue; // two pages once lived here: the most recently updated wins
      brukt.add(fra);
      linjer.push(`${enc(fra)} ${til} 301`);
      // A parent's old top-level address: its child pages moved with it (/kontakt/x → /kontakt-oss/x)
      if (harBarn && /^\/[^/]+$/.test(fra)) splats.push(`${enc(fra)}/* ${side}/:splat 301`);
    }
  }
  // Splat rules must come last: Cloudflare counts every rule after a splat as dynamic (max 100)
  return [...linjer, ...splats, '/index.php/* /:splat 301'];
}
