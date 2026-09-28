# Migration from the Joomla site

Source: https://www.arnatveit-borettslag.no/ (Joomla + Helix Ultimate + SP Page Builder), crawled 2026-09-25.

> ⚠️ The old site was **compromised** at crawl time: every page loads injected scripts from `dockmemoir.co`, `ginkgoloft.co` and `gorsegazette.co` (inside the "Praktisk info" menu). The migration only carries over text and PDFs — no HTML or scripts.

## What was migrated
- **10 pages** → `side` documents. Text is hand-curated in `scripts/migrate/content.mjs` (verbatim, see typo fixes below).
- **157 PDFs** → `dokument` documents with the file uploaded to Sanity. Category from the old folder, date parsed from the filename/link text. `scripts/migrate/inventory.mjs`.
  - ABC-nytt 117 · Protokoller 16 · Årsberetninger 5 · Søknader og skjema 8 · HMS 8 · Vedtekter 2 · Dugnad 1
- **Styret, Miljøutvalget** → `utvalg` documents. **Valgkomiteen** was created empty (names were blank on the old site).
- Contact details, addresses and org.nr → `innstillinger`.
- One news item (Generalforsamling 2026) → `nyhet`.

## Not migrated
- Images: the old site only had decorative PNG icons and illustrations. The new design uses its own illustration and icons. The old logo (`logo_org_kuttet.jpg`) was replaced by the design's mark.
- YouTube video "Karneval Arnatveit borettslag, februar 1988": now a link, not an embed.
- The "Utviklet av Vestland data AS" credit.

## URL changes (301)
| Old | New |
|---|---|
| `/praktiskinfo/{generalforsamling,vedtekter,styret,abc-nytt,dugnad,miljoutvalget}` | `/praktisk-info/…` |
| `/praktiskinfo/dokumentsenter` | `/dokumentsenter` |
| `/praktiskinfo` | `/praktisk-info` |
| `/kontakt-oss` | `/kontakt` |
| `/om-borettslaget` | unchanged |
| `/index.php/*` | `/:splat` |
| `/images/pdf/**` (157) | Sanity CDN URL of the file |

## Text fixes (typos on the old site)
fellesutgitene → fellesutgiftene · dugndslisten → dugnadslisten · ekstent → eksternt · nødvending → nødvendig · barneskoleskole → barneskole · "ARNATVEIT Borettslag" → "Arnatveit Borettslag". Kept as-is: "Miljøutvalet har blandt anna …".

Email addresses written as `(at)` on the old site are now real `mailto:` links.

## Content changes after the import (dataset change log)
Content changes made by script, not in the Studio. Each one read the documents first (drafts included), saved a backup, and wrote with targeted patches (`ifRevisionId`, so a document edited in the meantime is never overwritten). The migration script (`content.mjs`) was updated to match each time.

Backups are in `scripts/migrate/cache/`, which is **not in git**: they exist only on the machine that made them.

| Date | Change | Documents | Backup (`scripts/migrate/cache/…`) |
|---|---|---|---|
| 2026-09-27 | Pages: fixed `seksjon` replaced by `forelder` (parent page); 6 Praktisk info pages point to it | 10 pages + 1 draft | `backup-sider-2026-09-27T07-32-13-778Z.json` |
| 2026-09-27 | Card icons: own keys (`avis`, `dugnad` …) → Lucide names (`Newspaper`, `Sprout` …) | 6 pages | `backup-ikoner-2026-09-27T07-59-00-321Z.json` |
| 2026-09-27 | Page builder: `innhold` (one rich text field) → `seksjoner`; Praktisk info gets an `undersider` section | 10 pages | `backup-for-seksjoner-2026-09-27T09-35-29-800Z.json` (restore: `scripts/migrate/seksjoner.mjs --gjenopprett <file>`) |
| 2026-09-27 | Contact person: toggle on Anders Jordal; name field removed from Innstillinger; duplicate row removed from the fact list on Om borettslaget | utvalg-styret, innstillinger, side-om-borettslaget | `backup-kontaktperson-2026-09-27T18-20-20-164Z.json` |
| 2026-09-27 | Areas of responsibility on Arild Angelskår, Anders Jordal, Stian A. Persson; "Hvem kontakter jeg?" fact list on Styret replaced by the `ansvarsliste` section | utvalg-styret, side-styret | `backup-ansvar-2026-09-27T20-50-36-031Z.json` |
| 2026-09-27 | Styret redesign: new intro, contact box, section order (list heading "Styremedlemmer"); area texts and icons, Kundehenvendelser → Leverandører; Irene Myking and Ann Cicilie Tveiten marked vara (", vara" removed from roles); two adjacent text sections merged | side-styret, utvalg-styret + draft | `backup-styret-redesign-2026-09-27T22-28-46-876Z.json` (the merge afterwards had no separate backup; the state before it is in this file) |
| 2026-09-28 | Front page facts band: heading texts ("Å bo her" / "Tre tun, ett nabolag"), fact texts per design, Lekeplass → Lekeplasser, icons (logo, Huske, Mountain, TrendingUp) | forside | `backup-forside-fakta-2026-09-28T06-29-27-315Z.json` |

**Restoring:** each backup is a JSON array of the full documents as they were. `node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett <file>` restores any of them (it does `createOrReplace` on every document in the file). That also undoes later Studio edits to those documents, so check first.
