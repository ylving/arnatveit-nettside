// Generates Cloudflare `_redirects` (static assets) from `gamleUrler` on sider, dokumenter, ABC-nytt issues and general assemblies.
import type { APIRoute } from 'astro';
import { load } from '../lib/sanity';
import { docHref, type DocRef } from '../lib/urls';
import { DOC_REF_FIELDS } from '../lib/queries';
import { lagRedirects } from '../lib/redirects';

// Astro skips files starting with "_", so this is a dynamic route with a single path.
export const getStaticPaths = () => [{ params: { redirects: '_redirects' } }];

type Kilde = NonNullable<DocRef> & { gamleUrler: string[]; harBarn: boolean };

export const GET: APIRoute = async () => {
  const { kilder, sider, nyheter } = await load<{ kilder: Kilde[]; sider: NonNullable<DocRef>[]; nyheter: string[] }>(`{
    "kilder": *[_type in ["side", "dokument", "abcUtgave", "generalforsamling"] && count(gamleUrler) > 0] | order(_updatedAt desc){
      gamleUrler, ${DOC_REF_FIELDS},
      "harBarn": _type == "side" && count(*[_type == "side" && forelder._ref == ^._id]) > 0
    },
    "sider": *[_type == "side" && defined(slug.current)]{ ${DOC_REF_FIELDS} },
    "nyheter": *[_type == "nyhet" && defined(slug.current)].slug.current
  }`);

  // Every address the site serves right now: these must never be redirected away
  const levende = new Set<string>(['/', '/aktuelt', ...nyheter.map((s) => `/aktuelt/${s}`)]);
  for (const s of sider) { const h = docHref(s); if (h) levende.add(h); }

  const linjer = lagRedirects(
    kilder.flatMap((k) => { const til = docHref(k); return til ? [{ til, gamleUrler: k.gamleUrler, harBarn: k.harBarn }] : []; }),
    levende,
  );
  return new Response(['# Generated at build from Sanity (gamleUrler). Do not edit.', ...linjer].join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
