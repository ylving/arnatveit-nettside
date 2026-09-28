// Dugnad page per the design: new ingress; "Slik fungerer dugnad" (key figures, one paragraph, the document list
// without its own heading) replaces the infobox and the first text section. The text about signing off hours
// and HMS is kept below the list. The Dugnadsliste document gets the design's description.
//   node --env-file=.env scripts/migrate/dugnad.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/dugnad.mjs         back up, then write (restore: seksjoner.mjs --gjenopprett <file>)
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

const SIDE = 'side-dugnad';
const DOK = 'dokument-dugnad-dugnadskort1side-201104-2';
const docs = await client.fetch('*[_id in $ids]', { ids: [SIDE, DOK, `drafts.${SIDE}`, `drafts.${DOK}`] });
const utkast = docs.filter((d) => d._id.startsWith('drafts.'));
if (utkast.length) throw new Error(`Unpublished drafts exist (${utkast.map((d) => d._id).join(', ')}). Publish or discard them in the Studio first.`);
const side = docs.find((d) => d._id === SIDE);
const dok = docs.find((d) => d._id === DOK);
if (side.seksjoner.some((s) => s._type === 'nokkeltall')) { console.log('Nothing to do: already migrated.'); process.exit(0); }

const span = (text) => ({ _type: 'span', _key: `${text.length}s`, text, marks: [] });
const avsnitt = (_key, text) => ({ _type: 'block', _key, style: 'normal', markDefs: [], children: [span(text)] });

// The kept text section: drop its first sentence, which the new paragraph now says
const UTENOM = 'Dugnad utenom fellesdugnader, må avtales på forhånd med styret. ';
const beholdt = side.seksjoner.find((s) => s._key === 'tk2d');
const forste = beholdt?.innhold?.[0];
if (!forste || forste.children.length !== 1 || !forste.children[0].text.startsWith(UTENOM)) throw new Error('tk2d does not look as expected; not touching it.');
const beholdtNy = { ...beholdt, innhold: [{ ...forste, children: [{ ...forste.children[0], text: forste.children[0].text.slice(UTENOM.length) }] }, ...beholdt.innhold.slice(1)] };

const liste = side.seksjoner.find((s) => s._type === 'dokumentliste');
const { tittel: _tittel, ...listeUtenTittel } = liste;
const seksjoner = [
  side.seksjoner.find((s) => s._type === 'arrangementer'),
  {
    _type: 'nokkeltall', _key: 'slik-fungerer', tittel: 'Slik fungerer dugnad', bredde: 'bred',
    tall: [
      { _type: 'tallrad', _key: 'voksne', verdi: '150 kr', tekst: 'per time for voksne og barn over 13 år' },
      { _type: 'tallrad', _key: 'barn', verdi: '50 kr', tekst: 'per time for barn mellom 7 og 13 år' },
      { _type: 'tallrad', _key: 'aar', verdi: '2 400 kr', tekst: 'i året kan du tjene inn, like mye som dugnadspengene i husleien' },
    ],
  },
  {
    _type: 'tekst', _key: 'slik-tekst',
    innhold: [avsnitt('slik-p', 'Dugnadspengene på 200 kr i måneden er inkludert i husleien, og dugnaden utbetales én gang i året. Siden borettslaget ikke har vaktmester, er dugnaden viktig for oss alle. Dugnad utenom fellesdugnadene avtales på forhånd med styret.')],
  },
  listeUtenTittel,
  beholdtNy,
].filter(Boolean);

const INGRESS = 'Dugnadsinnsatsen til andelseierne holder fellesutgiftene nede. Og du får betalt for timene du legger ned.';
const BESKRIVELSE = 'Fyll ut og legg i borettslagets postkasse i A-tunet';

console.log(`${SIDE}\n  ingress: ${side.ingress}\n        ⇒  ${INGRESS}`);
console.log('  seksjoner:', side.seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '), '\n        ⇒ ', seksjoner.map((s) => `${s._type}(${s._key})`).join(' → '));
console.log('  kept text now starts:', beholdtNy.innhold[0].children[0].text.slice(0, 60), '…');
console.log(`${DOK}\n  beskrivelse: ${dok.beskrivelse ?? '(none)'}  ⇒  ${BESKRIVELSE}`);
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-dugnad-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([side, dok], null, 2));
console.log(`\nBackup: ${backup}`);
const res = await client.transaction()
  .patch(client.patch(SIDE).ifRevisionId(side._rev).set({ ingress: INGRESS, seksjoner }))
  .patch(client.patch(DOK).ifRevisionId(dok._rev).set({ beskrivelse: BESKRIVELSE }))
  .commit();
console.log(`Updated ${res.results.length} documents. Undo with: node --env-file=.env scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
