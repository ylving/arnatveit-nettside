# Plan: section-based page builder

_Status: **built 2026-09-27**, following all five recommendations below. Deviations: the insert menu uses a list with icons instead of a grid (the grid needs a preview image per type); the Studio preview for document lists shows the category but no document count; default widths are `bred` for grid layouts (members, contact, child pages) and `tekst` for row lists, which read poorly at 1200px._

## Goal
Pages (`side`) move from a single rich text editor (`innhold`) with blocks mixed into the text to **a list of sections**. Rich text becomes one section type. This makes it easier to reorder content, lets each section have its own settings, and lets list-type content break out of the narrow text column.

## Today
- `innhold` is Portable Text: text blocks plus the custom types `bilde`, `infoboks`, `dokumentliste`, `medlemsliste`, `faktaliste`, `kontaktinfo` and `lenkeknapp`. It's used by `side` and `nyhet`.
- All content renders inside `.prose` (max 72ch), so the member grid and document lists are squeezed.
- The front page (`forside`) is a singleton with fixed fields and a fixed order.
- If the current content were split into sections, it would look like this:

| Page | Sections |
|---|---|
| generalforsamling | tekst → dokumentliste → dokumentliste |
| dokumentsenter | tekst → dokumentliste → dokumentliste → infoboks → tekst → bilde → tekst _(the last four were added in the Studio by the user)_ |
| dugnad | tekst → infoboks → tekst → dokumentliste |
| styret | tekst → medlemsliste → faktaliste → tekst |
| vedtekter, abc-nytt | tekst → dokumentliste → tekst |
| miljoutvalget | tekst → medlemsliste |
| om-borettslaget | tekst → faktaliste → kontaktinfo |
| kontakt | kontaktinfo → tekst |
| praktisk-info | _(empty, shows child page cards only)_ |

## Content model

### `side.seksjoner` (replaces `side.innhold`)
An array of section objects. The Studio shows each item as a card with a preview, drag handle, duplicate and remove. The insert menu is a grid with an icon per type (`options.insertMenu`).

| Section | Contents | Studio preview |
|---|---|---|
| `tekst` | Portable Text: h2/h3, lists, bold/italic, links (internal and external) | first heading or line of text |
| `bilde` | image + alt (required) + caption | thumbnail + caption |
| `infoboks` | title + short Portable Text | title |
| `dokumentliste` | heading, category, group by year | "Protokoller · 16 dokumenter" |
| `medlemsliste` | reference to `utvalg` | "Styret · 7 medlemmer" |
| `faktaliste` | heading + label/value rows | heading |
| `kontaktinfo` | show map link | "Kontaktinfo (fra Innstillinger)" |
| `knapper` | 1–2 links as buttons (replaces `lenkeknapp`) | button texts |
| `undersider` | _(optional, see question 4)_ child page cards at this spot | "Undersider (6)" |

Every section except `tekst` and `infoboks` gets **`bredde`**: `tekst` (72ch) · `bred` (the content container) · `full` (edge to edge, images only). Each type has its own default: lists default to `bred`. No other section settings (background, anchor) until there's a need.

### Inside a text section
Text only. Everything structural lives in sections, so the text editor gets simpler than today. Whether small inline images are allowed is question 3.

### Studio help
- **Warning:** an empty text section.
- **Warning:** two text sections in a row ("kan slås sammen").
- **Existing checks move over:** unique slug, card text, and the collision warning are unchanged.

## Rendering
- **Section renderer:** a new `src/components/Seksjoner.astro` maps each section `_type` to a component, and wraps it in a container matching `bredde`. It keeps an even vertical rhythm between sections, with text sections tighter against each other.
- **Reuse:** the existing components in `components/portable/` are reused unchanged. They already take `node`.
- **Text sections:** `tekst` uses PortableText with only marks and links (a slimmed-down `Innhold.astro`).
- **Query:** `SEKSJONER` replaces `INNHOLD` in `src/lib/queries.ts`. The same dereferences (document lists, members, link targets) move to section level.
- **Page route:** `[...slug].astro` drops `.prose` around the whole page. Width is now decided per section.

## Migration
A script at `scripts/migrate/seksjoner.mjs`, following the same pattern as the earlier dataset changes:
1. **Read:** all `side` documents, published and drafts.
2. **Convert:** consecutive text blocks become one `tekst` section, and each custom block becomes its own section with the same data. Keys (`_key`) are kept. `lenkeknapp` becomes `knapper`.
3. **Dry run:** prints the section outline per page, like the table above, for approval before any writes.
4. **Write:** backup to `scripts/migrate/cache/`, then patches with `ifRevisionId`: set `seksjoner`, unset `innhold`. The user's own content (e.g. on Dokumentsenter) is included.
5. **Migration script:** `content.mjs` writes `seksjoner` directly, so a re-import gives the same structure.

The schema switches in one step locally: add `seksjoner`, migrate, then remove `innhold` from `side`. This is safe because the site isn't deployed yet.

## Verification
- **Same text before and after:** compare the text content of every page before and after migration (extracted from `dist/*.html`). Only layout should change.
- **Same links:** `_redirects` and page paths stay identical.
- **Standard checks:** `npm run typecheck`, `sanity schema validate`, build.
- **Visual check:** desktop and phone on the three most complex pages (Dokumentsenter, Styret, Dugnad).
- **Studio, by the user:** add, reorder, duplicate and remove sections; check the insert menu and previews.

## Order of work
1. Schema: section types, `side.seksjoner`, previews and insert menu.
2. Renderer and query. Build against migrated test data (dry-run output) before anything is written to the dataset.
3. Migration script: dry run → approval → run.
4. Remove `innhold` from `side`, update `content.mjs`, docs (`HANDOFF.md`, `README.md`).
5. Verification (above), commit.

## Outside this plan
- Front page as sections (see question 2).
- New section types (two columns, card grid, call-to-action). The model is built so they can be added without migration.
- `nyhet` (see question 1).

## Questions to decide before building
1. **News (`nyhet`):** keep the continuous editor (text-first, more natural for articles), or use the same sections? _Recommendation: keep it for now._
2. **Front page:** convert to sections now, or as a separate step afterwards? Front-page sections would be hero, fakta, aktuelt, praktisk-info cards and dokumentsenter box. _Recommendation: separate step, once the pages are in place._
3. **Images inside text sections:** allow small inline images in `tekst`, or only as their own section? _Recommendation: section only. It's simpler, and gives consistent layout._
4. **Child page cards:** keep them automatic above the content, as today, or make them an explicit `undersider` section the editor can place? _Recommendation: explicit section, automatically added by the migration to pages that have children. If a parent page has no such section, the cards appear at the end, so they never disappear._
5. **Width setting:** include `bredde` now, or start with fixed widths per type? _Recommendation: include it. It's cheap, and is the main layout gain._
