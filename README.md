# Arnatveit Borettslag

Astro (static) + Sanity, deployed as a Cloudflare Worker with static assets. Sanity Studio is embedded at `/admin` (hash routing, so it's fully static too).

## Setup
1. `cp .env.example .env` and fill in the project ID + dataset (both `PUBLIC_*` and `SANITY_STUDIO_*`).
2. In sanity.io/manage → API → CORS origins, add `http://localhost:4321` and `https://www.arnatveit-borettslag.no` (both **with credentials**, needed for the Studio).
3. `npm install`, `npm run dev` → http://localhost:4321, Studio at http://localhost:4321/admin

## Scripts
| | |
|---|---|
| `npm run dev` | Astro dev server |
| `npm run build` | Static build to `dist/` (fetches all content from Sanity) |
| `npm run preview` | `wrangler dev` against `dist/` (tests `_redirects` and the 404 page) |
| `npm run deploy` | Build + `wrangler deploy` |
| `node --env-file=.env scripts/migrate/run.mjs --dry` | Build import from old site, validate, no writes |
| `node --env-file=.env scripts/migrate/run.mjs` | Upload PDFs + write all documents to Sanity. ⚠️ Overwrites edits made in the Studio: initial import only |
| `npm run typecheck` | Type-check Studio code (schemas, custom inputs) |

## Publishing
Content is fetched at build time. Publishing in the Studio → a Sanity webhook triggers a Cloudflare Workers Builds deploy hook → rebuild (about 1 min).

## Redirects
`src/pages/[redirects].ts` generates `dist/_redirects` from the `gamleUrler` field on `side` and `dokument` documents. Old PDF URLs (`/images/pdf/…`) redirect to the file on Sanity's CDN.

See `docs/MIGRATION.md` (what was moved and how) and `docs/ROADMAP.md` (login, booking, R2).
