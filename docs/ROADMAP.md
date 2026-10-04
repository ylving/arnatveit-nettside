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

### 2a. Trailer booking (first booking to build; planned 2026-10-04, waiting on the board)
Today residents email an address and get the code and instructions as an auto-reply. Plan: a booking calendar on the trailer's page, **without resident login** (an email confirmation link proves the address).

- **Residents:** calendar of free/booked days (no names) → form (days, name, andel/address, email) → confirmation link by email → confirmed booking + email with code and instructions. Cancel link in the email.
- **Board:** overview page (list, cancel, block days for service) behind the existing Cloudflare Access login, so no auth to build. Optionally an email per new booking.
- **Tech:** D1 table for bookings (overlap check on insert), endpoints `/api/tilhenger/*` on the existing site Worker (like `/api/tog`; already `run_worker_first: ["/api/*"]`), so the site stays static, no adapter. Description and rules (max length, how far ahead) in Sanity; **the code is not in Sanity** (dataset may be publicly readable): a Worker secret or the board page. Fits the free plan.
- **Sending email** is the only new external part: SMTP2GO (DNS records `s945374._domainkey`/`em945374`/`link` already exist; find out who owns the account), else Cloudflare's email sending or Resend. Needs its own SPF/DKIM alignment; tie in with the open Domeneshop DKIM issue (see HANDOFF).
- **Effort:** about 2–3 days; a first version without self-service cancelling and without the board page (board gets emails instead) about 1 day.
- **Alternatives considered:** the board's portal (`portal` → styret.com, didn't answer 2026-10-04; check whether it's still used and has booking), or an embedded booking service (quick, but a monthly fee, its own look, residents' data with a third party).
- **Questions for the board before building:**
  1. Booking unit: whole days, or half days/hours? Max length? How far ahead?
  2. Who may book: anyone giving an andel number (trust, the board sees everything), or only addresses on a resident list (safer, must be maintained)?
  3. Confirmed at once, or approved by the board?
  4. Fixed code or changed now and then? (Fixed: anyone who booked once can use it later, same as today.)
  5. Fee or deposit? (Vipps makes it much bigger; leave out of v1.)
  6. Which address and system sends today's auto-reply? (Tells whether SMTP2GO is in use.)

## 3. Documents in R2
- For board/resident-only documents. Public PDFs can stay in Sanity.
- `dokument` gets `tilgang: 'offentlig' | 'beboer' | 'styret'` and optionally `r2Key`. Files are served through the Worker after a session check.
- Uploads: either a custom Studio input that uploads to R2 through a signed URL, or an admin page in `/beboer`.

`wrangler.jsonc` has the D1/R2 bindings as comments.
