# Handoff – Arnatveit Borettslag

_Last updated 2026-09-28 (events). Branch `main` (github.com:ylving/arnatveit-nettside). Check `git status` and `git log origin/main..` for anything not yet committed or pushed._

## State
The site is built and works locally. **Not deployed yet**: the user wants more local work first.

- **Stack:** Astro 7 (static output, no adapter) + Sanity 6, with the Studio embedded at `/admin` (hash routing). Deploys as a Cloudflare Worker serving static assets (`wrangler.jsonc`).
- **Sanity:** project `vx8672d7`, dataset `production`. `.env` holds `PUBLIC_*`, `SANITY_STUDIO_*` and `SANITY_WRITE_TOKEN`.
- **Content:** migrated from the old Joomla site: 10 pages, 157 PDFs, board and committees. Later content changes made by script are in the change log in `docs/MIGRATION.md`.
- **Docs:** `README.md` (setup and scripts), `docs/MIGRATION.md` (import + content change log), `docs/ROADMAP.md` (login, D1 booking, R2 documents: planned, not built).
- **Editor guide** (Norwegian, for the board): https://claude.ai/artifact/XSEPx6xMZ4G1Yae8qFQSyJ, source `docs/redaktorguide.html`. Keep it in step with Studio field names.

## How things work (non-obvious)
- **Page content:** `side.seksjoner` is a page builder (a list of sections: tekst, bilde, infoboks, dokumentliste, medlemsliste, faktaliste, kontaktinfo, knapper, undersider), rendered by `src/components/Seksjoner.astro`. Each section has a width (`bredde`; defaults in `sanity/standarder.ts`). News (`nyhet.innhold`) keeps the continuous rich text editor. Child page cards show where an `undersider` section is placed, otherwise at the end.
- **People (`utvalg.medlemmer`):** single source for contact details. Toggles: `kontaktperson` (one person site-wide; shown in the Kontaktinfo card) and `vara` (listed under "Varamedlemmer"). `ansvar[]` (area, text, icon) feeds the "Hvem kontakter jeg?" section (`ansvarsliste`). A member whose email equals the board address in Innstillinger shows "Nås via styret@".
- **Styret layout:** page head with optional `kontaktboks` (green box, full-width button on phones), `ansvarsliste` cards, `medlemsliste` rows with initials and tun markers. Breadcrumbs ("Parent / Page") come from `src/components/Brodsmuler.astro`.
- **Publishing ≠ rebuilding:** publishing in the Studio doesn't rebuild the site. The "Oppdater nettsiden" button in the Studio top bar does (writes `nettsidebygg`; the Sanity webhook fires only for that type → Cloudflare deploy hook). The button reads `/bygg.json` (build start time, `__BYGG_TID__` defined in `astro.config.mjs`) to list what's published but not live, and to see when the new build is out. Deletions aren't listed. In `astro dev`, `/bygg.json` is the dev server's start time.
- **Events (`arrangement`):** title, type (`kategori`: dugnad/sosialt), `start` (datetime, entered in Norwegian time), `slutt` (a clock time the same day, "14:00"), `sted`, optional `tun`, `beskrivelse`. Studio: Arrangementer → Kommende / Tidligere. Shown by the `arrangementer` section ("Hva skjer", `src/components/portable/HvaSkjer.astro`); its `kategori` is the type shown first and selected. Dates, filtering and .ics output are in `src/lib/arrangement.ts`. The default filter is rendered in HTML; a small inline script switches filters and moves "Neste" (the toggle stays hidden without JS). Only events from today on (Norwegian date) are shown, so the site needs the nightly rebuild (`workers/nattlig-bygg/`).
- **Calendar:** `/kalender.ics` (feed, linked as `webcal://`), `/kalender/<date>-<title>.ics` per event. Event UID = document id, so edits update in subscribers' calendars. Cloudflare serves `.ics` as `text/calendar` (checked with `wrangler dev`).
- **Member list layouts:** `medlemsliste.visning` = `rader` (rows with contact info, Styret) or `tun` (names grouped by tun in three columns, Miljøutvalget: `TunListe.astro`). `medlem.beplanting` (only shown in the Studio for Miljøutvalget) adds the leaf icon. `medlemsliste.ingress` is an optional line under the heading.
- **Document lists** (`Dokumentliste.astro`, all lists incl. news attachments): rows between lines, icon · title + optional `dokument.beskrivelse` · "PDF · 118 kB". The heading is the list's own `tittel` only (no fallback to the category name any more), so an empty heading means none; a heading-less list directly after a text section sits 28px under it.
- **Key figures (`nokkeltall`)**: heading + up to 4 big figures with a short text (Dugnad "Slik fungerer dugnad"). A text section right after it sits 28px under it.
- **Front page facts band** (`src/components/Faktabaand.astro`): heading texts in `forside.faktaseksjon`, facts in `forside.fakta` (icon from the picker, or `logo: true` for the logo mark).
- **Own icons:** `sanity/ikoner.ts` merges Lucide with our own (`Huske`, a swing set) in the same 24×24 stroke style; they appear in the picker too.
- **Phone numbers in free text** are kept on one line by `src/lib/tekst.ts`; emails wrap only after "@" via `src/components/Epost.astro`.
- **Pages (`side`):** a page can sit under any top-level page (`forelder`), one level deep, enforced in the Studio. The URL is `/<parent>/<slug>`. Parents list their children as cards. Card icon and text come from `ikon` and `kort` on the child page.
- **Icons:** Lucide via `sanity/ikoner.ts`, rendered to inline SVG at build time. The Studio picker is `sanity/components/IkonVelger.tsx` (collapsed row plus a dialog). The default icon is in `sanity/standarder.ts`.
- **Redirects:** `dist/_redirects` is generated by `src/pages/[redirects].ts` using `src/lib/redirects.ts`, from `gamleUrler` on pages and documents.
  - Old PDF paths redirect to the Sanity CDN.
  - A live page always beats an old address, because Cloudflare applies redirects before serving a page.
  - Wildcard rules must come last (Cloudflare's dynamic rule limit is 100).
- **Auto-redirect:** the page publish action (`sanity/actions/`) adds the old address to `gamleUrler` when a page's slug or parent changes. It's verified once in the real Studio.
- **Menu breakpoint:** set in Innstillinger (`menyBrytepunkt`), default 1080. It's written into the header's media query at build time, which is why the header CSS is an `is:inline` block.
- **Fixed page ids:** the front page and footer refer to pages by fixed id (`side-praktisk-info`, `side-dokumentsenter`, `side-kontakt`). If one of those pages is deleted and recreated, those links disappear.

## Gotchas learned
- **`astro dev`:** caches `getStaticPaths()`. `integrations/sanity-dev-refresh.mjs` clears it when pages or news are published. Redirects never apply in `astro dev`; test them with `npm run build && npm run preview`.
- **Stale styles in `astro dev`:** edits to a component's `<style>` sometimes don't reach the running dev server; the markup updates, the CSS doesn't (seen twice: footer logo, contact card font). `touch` the component or restart. Check computed styles before assuming a CSS bug.
- **One dev server per project:** Astro 7 allows only one. For a second test server, use `wrangler dev --port 8799` on `dist/`.
- **`Astro.url.pathname`:** ends in `.html` in static builds. Always use `pagePath()` from `src/lib/urls.ts`.
- **`@sanity/ui` v4:** `columns` is now `gridTemplateColumns`, and `space` is now `gap`. Removed props are silently ignored at runtime. Run `npm run typecheck` (Studio code) after touching Studio components.
- **Shell:** `cp` is aliased to `cp -i` here and hangs on overwrite. Use `command cp -f`.
- **Dataset changes:** content changes made by scripts were patched with `ifRevisionId`. Backups are in `scripts/migrate/cache/`, which isn't in git.
- **Don't re-run the full import (`scripts/migrate/run.mjs`):** it uses `createOrReplace` and would overwrite edits made in the Studio (e.g. the additions on Dokumentsenter).
- **Screenshots:** full-page screenshots don't load lazy images. Scroll the image into view first.

## Open / not verified
- The collision warning ("adressen var tidligere brukt av …") hasn't been seen in a logged-in Studio. Its query was tested read-only.
- The hero image option hasn't been tested with a real uploaded image. The fallback to the illustration works.
- The icon picker shows some older Lucide alias names (e.g. "home" instead of "house"). Cosmetic.
- Valgkomiteen (`utvalg-valgkomiteen`) is empty. The names were blank on the old site.
- The commit author email is the user's personal address, not the Aksell one. The user never answered whether to change it.
- **Not seen in a logged-in Studio yet** (schema validates and type-checks, site renders): Kontaktboks on pages, Varamedlem toggle, icons on areas of responsibility, "Gjelder det noe annet?" option, heading on member lists, front page Faktaseksjon/Faktakort (logo switch + icon), the own icon "Huske" in the picker.
- **Editor guide** is private: share it from the page's Share menu before board members can open it. Not yet checked against a logged-in Studio.
- **Styret vs. design, decided conservatively:** the page's existing text ("Saker du ønsker…", "Kunne du tenkt deg å bli styremedlem?") is kept below the member lists (not in the design); cards show the member's full role (design shows a shorter one); the shorter phone intro from the design isn't used.
- `align-items: end` on `.page-head.med-boks` (global.css) was the user's own edit; it went into commit `5e27f50`.
- **Security:** the old Joomla site is compromised (injected scripts from `dockmemoir.co`, `ginkgoloft.co`, `gorsegazette.co`). The site owner or maintainer must clean it before the domain moves.

- **Events, not verified in a logged-in Studio:** the event form (datetime in Norwegian time, end time validation), Kommende/Tidligere lists, the Hva skjer section and the Visning/beplanting fields. The site side was checked with temporary test events (deleted again): toggle, Neste, month groups, empty state, no-JS view, .ics files, desktop 1440 and phone 390.
- **Events, decided without asking:** type named `arrangement` (Norwegian, like the other types); `tun` is a choice of A/B/C-tunet (there is no tun document to reference), shown as the small house marker when the place text doesn't already name it; descriptions are shown on phones too (the mobile artboard leaves them out); the toggle is hidden without JS rather than shown as dead buttons; events without an end time get no DTEND in the .ics.
- **Feed only has upcoming events:** subscribed calendars drop an event once it's past and the feed is rebuilt. If people want past dugnads kept in their calendars, keep e.g. the last 90 days in the feed.
- **`webcal://`** works in Apple Calendar and Outlook; Google Calendar needs the https address pasted in ("Fra nettadresse").
- **Dugnad text, decided conservatively:** the old infobox and first text section were replaced by the design's figures and paragraph. Dropped because the design has no equivalent: "ville ellers ha kostet en del penger å leie inn folk", "Vedlikehold av borettslagets uteområder blir oftest kalt dugnad" and "Ofte er det miljøutvalget eller styret som inviterer til dette". Kept below the document list, not in the design: signing off hours ("Utførte dugnadstimer skal kvitteres …") and the HMS paragraph. The text still says "Dugnadskortet" while the document is called "Dugnadsliste".
- **Not done from the artboards:** Miljøutvalget's new ingress (bokmål version in the design; the current text was kept as-is on purpose at import).

## Next up (after /clear)
**Dugnad and Miljøutvalget are done** except Miljøutvalget's ingress (ask the user). Real events need entering in the Studio (one real one, "Høstdugnad" 30 Sep, was added by someone during the build session).
- Sections now: **Dugnad** `arrangementer → nokkeltall → tekst → dokumentliste (no heading) → tekst`; **Miljøutvalget** `arrangementer → medlemsliste (visning: tun)`.
- Approach that worked for Styret: build reusable components/fields rather than page-specific markup; follow the design's copy; keep existing text that isn't in the design and flag it; migrate content with backup + `ifRevisionId` and add it to the change log in `docs/MIGRATION.md`; update `scripts/migrate/content.mjs`; check desktop 1440 and phone 390 against the design; update the editor guide if Studio fields change.

## Next steps (deploy)
_Status 2026-09-28: steps 1–2 done. The Worker `arnatveit-borettslag` runs in the Cloudflare account "Arnatveit borettslag" (`361c9a9d…`; wrangler also sees the user's personal account, so pin `CLOUDFLARE_ACCOUNT_ID`) at https://arnatveit-borettslag.arnatveit-borettslag.workers.dev. The deploy hook and Sanity webhook exist; the webhook's filter must become `_type == "nettsidebygg"` once the Studio button is deployed. Left: nightly Worker, DNS move (Domeneshop → Cloudflare; copy MX `mx.domeneshop.no`, SPF, DMARC, MS and Google TXT records), custom domain `www` + apex→www redirect rule, production CORS origin._
_Rendering on request was prototyped (branch `prototype-ssr`, local only): 4–11.5 ms CPU median per page on Cloudflare, p90 up to 17 ms, so it needs Workers Paid ($5). Decision: stay static for now; revisit with resident login._
1. **Cloudflare Workers Builds:** connect the GitHub repo.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Build variables: `PUBLIC_SANITY_PROJECT_ID=vx8672d7`, `PUBLIC_SANITY_DATASET=production`
2. **Deploy hook:** create one in Cloudflare and point a Sanity webhook at it, filter `_type == "nettsidebygg"` (only the Studio's "Oppdater nettsiden" button triggers builds).
   - **Nightly rebuild:** deploy `workers/nattlig-bygg/` with the hook URL as the `DEPLOY_HOOK_URL` secret (README, Publishing).
3. **CORS:** add the production domain as a Sanity CORS origin, with credentials.
4. **Check** the deployed site, then switch DNS.
