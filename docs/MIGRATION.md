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
| 2026-09-28 | Events: "Hva skjer" section first on Dugnad (dugnad) and Miljøutvalget (sosialt). Miljøutvalget: placeholder text ("På denne siden vil informasjon om slikt bli lagt ut." + heading "Utvalget består av") removed; member list gets heading "Utvalget", intro "Miljøutvalget har medlemmer fra alle tre tun." and tun grouping; Tove Samuelsen and Lisbeth L. Strand: role "Utvidet beplantingsutvalg" → `beplanting` toggle. Script: `scripts/migrate/arrangementer.mjs` | side-dugnad, side-miljoutvalget, utvalg-miljoutvalget | `backup-arrangementer-2026-09-28T09-09-03-503Z.json` |
| 2026-09-28 | Dugnad per design: new ingress; "Slik fungerer dugnad" (`nokkeltall` section 150 kr / 50 kr / 2 400 kr, one paragraph, the document list without its heading) replaces the infobox and the first text section; the text about signing off hours and HMS is kept below the list (its first sentence, now in the new paragraph, removed). Dugnadsliste document: description "Fyll ut og legg i borettslagets postkasse i A-tunet" (not in the import scripts). Script: `scripts/migrate/dugnad.mjs` | side-dugnad, dokument-dugnad-dugnadskort1side-201104-2 | `backup-dugnad-2026-09-28T09-32-09-462Z.json` |
| 2026-09-30 | Dokumentsenter per design: category "Søknader og skjema" split into Søknader, Bygging and Skjemaer (new), HMS kept; the four get `ingress`, `farge`, `ikon` and sorting "Egen rekkefølge"; 16 documents moved, with `rekkefolge`, the design's descriptions, HMS titles shortened with the tun moved to the new `tun` field (e.g. "Sjekkliste for lekeplass i C-tunet" → "Sjekkliste for lekeplass" + C-tunet; shared areas "Felles"), "Søknad om bruksoverlating/utleie …" → "… bruksoverlating / utleie …"; "HMS-sjekkliste til beboere" (not in the design) moved to HMS and kept; four `oppgave` documents ("Jeg vil …"); page: new ingress, sections `oppgaver` → `dokumentsok` (the text "Under finner du standardsøknader og prosedyrer for søknader." removed). Script: `scripts/migrate/dokumentsenter.mjs` (data in `dokumentsenter-data.mjs`, shared with the import) | side-dokumentsenter, 16 dokument, 4 dokumentkategori (+1 deleted), 4 oppgave | `backup-dokumentsenter-2026-09-30T07-49-08-676Z.json` (the new categories and tasks must be deleted by hand after a restore) |
| 2026-09-30 | ABC-nytt as its own type: the 117 issues (`dokument` in category ABC-nytt) → `abcUtgave` with `maaned`/`aar` from the date, the same PDF asset and `gamleUrler` (ids `abc-YYYY-MM`); the old documents and category `kategori-abc-nytt` deleted; page: new ingress, sections `abcUtgaver` → the Karneval text ("Under finner du tidligere utgaver." removed); Irene Myking: `abcRedaktor` on. Script: `scripts/migrate/abc-nytt.mjs`. Covers afterwards by `scripts/abc-forsider.mjs` (no backup needed: only adds `forside`) | side-abc-nytt, utvalg-styret, 117 abcUtgave (+117 dokument and 1 dokumentkategori deleted) | `backup-abc-nytt-2026-09-30T07-55-40-235Z.json` (after a restore, delete the `abc-*` documents by hand) |
| 2026-09-30 | Task steps can have several documents: `oppgave.steg[].dokument` → `dokumenter` (list). Script: `scripts/migrate/oppgave-dokumenter.mjs` | 4 oppgave | `backup-oppgave-dokumenter-2026-09-30T08-13-56-449Z.json` |
| 2026-09-30 | "Om oss og kontakt": Om borettslaget and Kontakt merged into /om-borettslaget. New singleton `omBorettslaget` (contact details from Innstillinger, removed there; facts from the page's fact list; notes per design; addresses formatted per design: "11–185", "Org.nr. 946 024 627"). side-om-borettslaget: design ingress, `snarveier`, sections `kontaktinfo` (with two link rows) → `fargebaand` (Området, design text) → `borettslagsfakta`; its old text section and fact list replaced; `gamleUrler` `/kontakt#kontakt`, `/kontakt-oss#kontakt`. side-kontakt deleted (its ingress became the note under styret@, its two link sentences the link rows). Menu: "Om borettslaget" → "Om oss og kontakt", "Kontakt" removed. Script: `scripts/migrate/om-borettslaget.mjs` | omBorettslaget (new), side-om-borettslaget, innstillinger, side-kontakt (deleted) | `backup-om-borettslaget-2026-09-30T09-00-02-386Z.json` (after a restore, delete omBorettslaget) |
| 2026-09-30 | Generalforsamling per design: the 16 protocols (`dokument` in category Protokoller) → `generalforsamling` (date, `type` ordinær/ekstraordinær from the title, the same PDF asset, `gamleUrler`; ids `gf-YYYY` / `gf-YYYY-ekstraordinaer`; `sted` "Arna Misjonsmenighet" on 2026 only); the old documents and `kategori-protokoller` deleted; page: design ingress, sections `punkter` (Slik fungerer det) → `oppfordring` (Vil du melde inn en sak?) → `generalforsamlinger` (Neste: "Ordinær generalforsamling våren 2027 …") → the existing Årsberetninger list (not in the design, kept); the old text section ("Om generalforsamlingen", Valgkomiteen) replaced by the four points; banner: `sisteProtokoll` on (link to the newest protocol); news 2026: attachment → `gf-2026`. Script: `scripts/migrate/generalforsamling.mjs` (data in `generalforsamling-data.mjs`, shared with the import) | side-generalforsamling, innstillinger, nyhet-generalforsamling-2026, 16 generalforsamling (+16 dokument and 1 dokumentkategori deleted) | `backup-generalforsamling-2026-09-30T09-34-47-539Z.json` (after a restore, delete the `gf-*` documents) |
| 2026-09-30 | Årsberetninger on Generalforsamling as a timeline like Protokoller: `grupperEtterAar` on (now "Vis som tidslinje etter år"), `bredde` bred. Script: `scripts/migrate/arsberetninger.mjs` | side-generalforsamling | `backup-arsberetninger-2026-09-30T09-45-08-451Z.json` |

**Restoring:** each backup is a JSON array of the full documents as they were. `node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett <file>` restores any of them (it does `createOrReplace` on every document in the file). That also undoes later Studio edits to those documents, so check first.
