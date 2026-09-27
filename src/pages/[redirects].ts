// Generates Cloudflare `_redirects` (static assets) from `gamleUrler` on sider and dokumenter.
import type { APIRoute } from 'astro';
import { load } from '../lib/sanity';
import { docHref, type DocRef } from '../lib/urls';
import { DOC_REF_FIELDS } from '../lib/queries';

// Astro skips files starting with "_", so this is a dynamic route with a single path.
export const getStaticPaths = () => [{ params: { redirects: '_redirects' } }];

// Paths contain spaces etc. — Cloudflare matches the percent-encoded request path.
const enc = (p: string) => encodeURI(p);

export const GET: APIRoute = async () => {
  const docs = await load<(NonNullable<DocRef> & { gamleUrler: string[] })[]>(
    `*[_type in ["side", "dokument"] && count(gamleUrler) > 0]{ gamleUrler, ${DOC_REF_FIELDS} }`,
  );
  const lines = ['# Generated at build from Sanity (gamleUrler). Do not edit.'];
  for (const d of docs) {
    const to = docHref(d);
    if (!to) continue;
    for (const from of d.gamleUrler) if (from !== to) lines.push(`${enc(from)} ${to} 301`);
  }
  // Splat rules must come last: Cloudflare counts every rule after a splat as dynamic (max 100)
  lines.push('/index.php/* /:splat 301');
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
