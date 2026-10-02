// The site's Worker: static assets for everything, plus GET /api/tog (next trains to Bergen from Arna stasjon, from
// Entur). Only /api/* reaches this code (run_worker_first in wrangler.jsonc); every other request is served by the
// assets layer directly, redirects included.
//
// /api/tog: fresh for 30 s; on upstream errors the last good answer for up to 15 min, then { status: "unavailable" }.
// Two layers: the isolate's memory (works everywhere) and the edge Cache API (only on a custom domain: it does
// nothing on workers.dev or behind Cloudflare Access, i.e. on the test address).
import { TOG, type Avgang, type TogSvar } from '../../src/lib/tog';

interface Env { ASSETS: Fetcher }

const FERSK = 30_000;
const GAMMEL = 15 * 60_000;
const NOKKEL_FERSK = 'https://cache.arnatveit.internal/api/tog/fersk';
const NOKKEL_SIST = 'https://cache.arnatveit.internal/api/tog/sist';

const QUERY = `query ($id: String!) {
  stopPlace(id: $id) {
    estimatedCalls(numberOfDepartures: 10, whiteListedModes: [rail]) {
      aimedDepartureTime expectedDepartureTime realtime cancellation
      quay { publicCode }
      destinationDisplay { frontText }
      serviceJourney { line { publicCode } }
    }
  }
}`;

let minne: { svar: TogSvar; tid: number } | null = null;

async function hentEntur(): Promise<Avgang[]> {
  const res = await fetch(TOG.entur, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'ET-Client-Name': TOG.klientnavn },
    body: JSON.stringify({ query: QUERY, variables: { id: TOG.stoppested } }),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Entur ${res.status}`);
  const data: any = await res.json();
  const kall: any[] | undefined = data?.data?.stopPlace?.estimatedCalls;
  if (!Array.isArray(kall)) throw new Error(`Entur: ${JSON.stringify(data?.errors ?? 'no data').slice(0, 200)}`);
  return kall
    .filter((k) => TOG.motBergen(k.destinationDisplay?.frontText ?? ''))
    .slice(0, TOG.antall)
    .map((k) => ({
      aimed: k.aimedDepartureTime,
      expected: k.expectedDepartureTime ?? k.aimedDepartureTime,
      realtime: !!k.realtime,
      cancelled: !!k.cancellation,
      platform: k.quay?.publicCode || null,
    }));
}

const json = (svar: TogSvar, maxAge: number) =>
  new Response(JSON.stringify(svar), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}` },
  });

async function tog(ctx: ExecutionContext): Promise<Response> {
  const naa = Date.now();
  if (minne && minne.svar.status === 'ok' && naa - minne.tid < FERSK) return json(minne.svar, Math.ceil((FERSK - (naa - minne.tid)) / 1000));
  const cache = caches.default;
  const iCache = await cache.match(NOKKEL_FERSK);
  if (iCache) return iCache;

  try {
    const svar: TogSvar = { status: 'ok', avganger: await hentEntur() };
    minne = { svar, tid: naa };
    ctx.waitUntil(Promise.all([
      cache.put(NOKKEL_FERSK, json(svar, FERSK / 1000)),
      cache.put(NOKKEL_SIST, new Response(JSON.stringify({ svar, tid: naa }), { headers: { 'cache-control': `max-age=${GAMMEL / 1000}` } })),
    ]));
    return json(svar, FERSK / 1000);
  } catch (feil) {
    console.error('tog:', feil instanceof Error ? feil.message : feil);
    let sist = minne;
    if (!sist || naa - sist.tid > GAMMEL) {
      const lagret = await cache.match(NOKKEL_SIST);
      if (lagret) sist = (await lagret.json()) as { svar: TogSvar; tid: number };
    }
    if (sist && naa - sist.tid <= GAMMEL) return json({ ...sist.svar, status: 'stale' }, 15);
    return json({ status: 'unavailable', avganger: [] }, 15);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/tog') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
      return tog(ctx);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
