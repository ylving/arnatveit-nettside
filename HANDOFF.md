# Handoff – Arnatveit Borettslag

_Last updated 2026-09-30 (deployed to workers.dev; rebuild button; nightly Worker). Branch `main` (github.com:ylving/arnatveit-nettside). Check `git status` and `git log origin/main..` for anything not yet committed or pushed._

## State
**Deployed to a test address, not launched.** https://arnatveit-borettslag.arnatveit-borettslag.workers.dev is now behind **Cloudflare Access** (login page), so it can't be checked with curl from here; the user checks it in their browser. The domain still points at the old (compromised) Joomla site.

- **Stack:** Astro 7 (static output, no adapter) + Sanity 6, with the Studio embedded at `/admin` (hash routing). Deploys as a Cloudflare Worker serving static assets (`wrangler.jsonc`), built by **Cloudflare Workers Builds** on every push to `main`.
- **Cloudflare:** account "Arnatveit borettslag" (`361c9a9dd3bbb7b53cdc0224f872c2b6`). `wrangler` is logged in as the user and also sees their personal account, so always prefix commands with `CLOUDFLARE_ACCOUNT_ID=361c9a9dd3bbb7b53cdc0224f872c2b6`. Workers: `arnatveit-borettslag` (site), `arnatveit-nattlig-bygg` (cron 01:00 UTC).
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
**Rebuild of Dokumentsenter and ABC-nytt** per the new artboards on the design canvas https://claude.ai/artifact/W8XADesGHKexHum3fQ7X6X (read with the Artifact tool, not by fetching): `project/Dokumentsenter.dc.html`, `project/DokumentsenterMobile.dc.html`, `project/AbcNytt.dc.html`, `project/AbcNyttMobile.dc.html`. The user calls it "rather large".
- Current sections: **Dokumentsenter** (`side-dokumentsenter`, top level) `tekst → dokumentliste (HMS) → dokumentliste (Søknader og skjema, heading "Dokumenter")`; **ABC-nytt** (`side-abc-nytt`, under Praktisk info) `tekst → dokumentliste (grouped by year, heading "Utgaver") → tekst (Karneval video link)`. Both lists use the new row style (`Dokumentliste.astro`), shared with every other document list, so changes there affect Generalforsamling, Vedtekter, Dugnad and news attachments too.
- The front page also shows the latest ABC-nytt and a Dokumentsenter box (`src/pages/index.astro`, `forside.dokumentsenter`); check them if document data changes.
- Approach that worked (Styret, Dugnad, Miljøutvalget): build reusable components/fields rather than page-specific markup; follow the design's copy; keep existing text that isn't in the design and flag it; migrate content with a script (`--dry` first, backup, `ifRevisionId`, abort on drafts; see `scripts/migrate/dugnad.mjs`) and add it to the change log in `docs/MIGRATION.md`; update `scripts/migrate/content.mjs`; check desktop 1440 and phone 390 against the design (`npm run build`, `npx wrangler dev --port 8799`, Playwright); update the editor guide (`docs/redaktorguide.html`, republish to its artifact URL) if Studio fields change. Content goes live only when someone presses "Oppdater nettsiden" (or at the nightly build); code goes live on push.
- Still open from earlier: Miljøutvalget's ingress (bokmål in the design; ask the user). The front page heading had a test typo "…døraaa" on 2026-09-28; the user was fixing it.

## Next steps (deploy)
Done: Workers Builds connected to GitHub (build `npm run build`, deploy `npx wrangler deploy`, variables `PUBLIC_SANITY_PROJECT_ID=vx8672d7`, `PUBLIC_SANITY_DATASET=production`, `NODE_VERSION=22`); deploy hook; Sanity webhook with filter `_type == "nettsidebygg"` (verified: publishing alone doesn't build, the button does); workers.dev CORS origin in Sanity; nightly Worker deployed.

Left:
1. **Nightly Worker secret:** the user adds `DEPLOY_HOOK_URL` (the deploy hook URL) as a Secret on `arnatveit-nattlig-bygg` in the dashboard (Settings → Variables and Secrets). Until then the cron runs and throws. Check its logs after the first night.
2. **DNS move** (Domeneshop `hyp.net` → Cloudflare nameservers). Copy first, then compare with Domeneshop's DNS panel (a lookup can't list everything): MX `10 mx.domeneshop.no`, TXT `v=spf1 include:_spf.domeneshop.no -all`, `_dmarc` TXT `v=DMARC1; p=none`, TXT `MS=ms84266225`, TXT `google-site-verification=ryfsfRbDlZBo-_HiZCuEysFrESRyL3jvSGOathW5oDM`.
3. **Custom domain** `www.arnatveit-borettslag.no` on the Worker (canonical, `site` in `astro.config.mjs`), plus a redirect rule apex → www.
4. **Sanity CORS:** add `https://www.arnatveit-borettslag.no` with credentials.
5. **Check** the live site (redirects, 404, `.ics`, `/admin`, the button), then have the old Joomla hosting shut down.

**Rendering on request** was prototyped and measured (branch `prototype-ssr`, local only, not pushed; the worktree was in a session scratchpad, so it may be gone — `git worktree prune` removes the stale entry): 4–11.5 ms CPU median per page on Cloudflare, p90 up to 17 ms, bundle 497 KiB gzipped. That exceeds the free plan's 10 ms, so it needs Workers Paid ($5/month). Decision: stay static for now. The Arnatveit Cloudflare account will be upgraded to Workers Paid soon (same account, billing only: nothing to redo, and the DNS move doesn't need to wait); after that, switching to on-request rendering (about a day: request-time redirects, caching with purge on publish, drop the button/webhook filter/nightly Worker) is an option whenever the user wants it.
