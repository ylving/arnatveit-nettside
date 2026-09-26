# Later features (planned, not built)

Everything today is static. These three features need server code on the same Worker.

## 1. Resident login (`/beboer/*`)
- Add the `@astrojs/cloudflare` adapter. Keep `output: 'static'` and mark only `/beboer/*` and `/api/*` as `prerender = false`.
- Auth options: magic link by email with sessions in D1 (simple, no passwords), or Cloudflare Access (zero code, but a "Cloudflare" login screen). Decide when we start.
- Residents: one row per andel (79), linked to email address(es). The board maintains it (from the Studio, or an admin page).
- Header: "Beboerside" button (in the design, left out for now).

## 2. Booking of shared spaces (D1)
- Tables: `lokale` (spaces), `booking` (lokale_id, andel_id, start, slutt, status), `andel`.
- Prevent overlaps in SQL (check on insert inside a transaction).
- The rules and descriptions of each space can live in Sanity. Only the bookings go in D1.

## 3. Documents in R2
- For board/resident-only documents. Public PDFs can stay in Sanity.
- `dokument` gets `tilgang: 'offentlig' | 'beboer' | 'styret'` and optionally `r2Key`. Files are served through the Worker after a session check.
- Uploads: either a custom Studio input that uploads to R2 through a signed URL, or an admin page in `/beboer`.

`wrangler.jsonc` has the D1/R2 bindings as comments.
