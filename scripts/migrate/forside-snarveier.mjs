// Front page, Dokumentsenter box: the three first shortcuts (documents) → the matching "Jeg vil …" tasks, so they open
// the steps on Dokumentsenter. Vedtekter stays a document link.
//   node --env-file=.env scripts/migrate/forside-snarveier.mjs --dry   show the changes, write nothing
//   node --env-file=.env scripts/migrate/forside-snarveier.mjs         back up, then write
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });

// document → task
const BYTT = {
  'dokument-dokumentsenter-rutiner-ved-bygging-av': 'oppgave-bygg',
  'dokument-dokumentsenter-soknad-varmepumpe': 'oppgave-varmepumpe',
  'dokument-dokumentsenter-skjema-soknadomdyrehold': 'oppgave-husdyr',
};

const { forside, utkast, oppgaver } = await client.fetch(`{
  "forside": *[_id == "forside"][0],
  "utkast": *[_id == "drafts.forside"]._id,
  "oppgaver": *[_id in $ids]{ _id, tittel }
}`, { ids: Object.values(BYTT) });
if (utkast.length) throw new Error('The front page has an unpublished draft. Publish or discard it in the Studio first.');
if (oppgaver.length !== 3) throw new Error(`Tasks missing (found ${oppgaver.map((o) => o._id).join(', ')})`);
const naa = forside.dokumentsenter?.dokumenter ?? [];
if (!naa.some((r) => BYTT[r._ref])) { console.log('Nothing to do: no shortcuts to swap (already migrated?).'); process.exit(0); }
const nye = naa.map((r) => (BYTT[r._ref] ? { ...r, _ref: BYTT[r._ref] } : r));
const navn = Object.fromEntries(oppgaver.map((o) => [o._id, o.tittel]));

console.log('forside.dokumentsenter.dokumenter:');
naa.forEach((r, i) => console.log(`  ${r._ref.padEnd(48)} ⇒ ${nye[i]._ref}${navn[nye[i]._ref] ? ` («${navn[nye[i]._ref]}»)` : ''}`));
if (process.argv.includes('--dry')) { console.log('\nDry run, nothing written.'); process.exit(0); }

const backup = `scripts/migrate/cache/backup-forside-snarveier-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(backup, JSON.stringify([forside], null, 2));
console.log(`\nBackup: ${backup}`);
await client.patch('forside').ifRevisionId(forside._rev).set({ 'dokumentsenter.dokumenter': nye }).commit();
console.log(`Done. Undo: scripts/migrate/seksjoner.mjs --gjenopprett ${backup}`);
