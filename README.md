# Arnatveit Borettslag

Astro (static) + Sanity, deployed as a Cloudflare Worker with static assets. Sanity Studio is embedded at `/admin` (hash routing, so it's fully static too). A small Worker (`workers/nettside/index.ts`) answers `/api/*` only: `GET /api/tog` gives the next trains to Bergen from Entur for the front page; every other request goes straight to the static assets. `npm run preview` (`wrangler dev`) runs it locally; `astro dev` doesn't, so there the train card shows its fallback text.

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
Content is fetched at build time, so the site is rebuilt (about 1–2 min) in three ways:
- **"Oppdater nettsiden"** in the Studio's top bar (`sanity/components/OppdaterNettsiden.tsx`): editors publish as much as they like, then press it once. It writes the hidden `nettsidebygg` document; a Sanity webhook with the filter `_type == "nettsidebygg"` calls the Cloudflare Workers Builds deploy hook. The button lists published changes that aren't live yet by comparing `_updatedAt` with the site's build time in `/bygg.json`.
- **A push to `main`** (Workers Builds).
- **Nightly** (below).

**Nightly rebuild:** past events have to disappear from "Hva skjer" and the calendar feed even when nobody publishes. `workers/nattlig-bygg/` is a separate Worker with only a cron trigger (01:00 UTC) that calls the same deploy hook. Set it up once:
```sh
cd workers/nattlig-bygg
npx wrangler secret put DEPLOY_HOOK_URL   # the Workers Builds deploy hook URL
npx wrangler deploy
```

## Events and calendar
`arrangement` documents are listed by the "Hva skjer" page section (`src/components/portable/HvaSkjer.astro`). Only events from today on are shown (Norwegian date), so today's event stays up until the nightly rebuild.
- `/kalender.ics`: feed of all upcoming events ("Abonner på kalenderen", linked as `webcal://`)
- `/kalender/<date>-<title>.ics`: one file per event ("Legg i kalender")

## Redirects
`src/pages/[redirects].ts` generates `dist/_redirects` from the `gamleUrler` field on `side` and `dokument` documents. Old PDF URLs (`/images/pdf/…`) redirect to the file on Sanity's CDN.

## Docs
- `HANDOFF.md`: current state, how things work, gotchas, next steps (start here)
- `docs/MIGRATION.md`: the import from the old site, plus a change log of later content changes made by script
- `docs/ROADMAP.md`: planned features (login, booking, R2)
- `docs/PLAN-seksjoner.md`: the page builder plan (built)
- **Editor guide for the board** (Norwegian): https://claude.ai/artifact/XSEPx6xMZ4G1Yae8qFQSyJ, source in `docs/redaktorguide.html`. Update it when Studio fields change.
