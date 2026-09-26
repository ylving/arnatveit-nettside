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
