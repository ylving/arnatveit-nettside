// Import old site into Sanity.
//   node --env-file=.env scripts/migrate/run.mjs --dry   → build + validate, write cache/import.json, no network to Sanity
//   node --env-file=.env scripts/migrate/run.mjs         → upload PDFs + createOrReplace all documents
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { inventory, download } from './inventory.mjs';
import { buildContent } from './content.mjs';
import { dokumentFelter } from './dokumentsenter-data.mjs';
import { DOKUMENTER as VEDTEKTER } from './vedtekter-data.mjs';
import { tilGeneralforsamling } from './generalforsamling-data.mjs';

const DRY = process.argv.includes('--dry');
const CACHE = new URL('./cache/', import.meta.url).pathname;

const slugify = (s) => s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function sentenceCase(s) {
  const t = s.toLowerCase()
    .replace(/\b([abc])-(?=tunet|\s+og)/g, (m) => m.toUpperCase())
    .replace(/\bhms\b/g, 'HMS')
    .replace(/arnatveit borettslag/g, 'Arnatveit Borettslag');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function title(d) {
  const year = d.dato?.slice(0, 4);
  if (d.kategori === 'abc-nytt') return `ABC-nytt ${d.text.toLowerCase()} ${year}`;
  if (d.kategori === 'protokoller') {
    if (/les årets protokoll/i.test(d.text)) return `Generalforsamling ${year}`;
    if (/^e\.o\.?\s/i.test(d.text)) return `Ekstraordinær generalforsamling ${year}`;
  }
  return sentenceCase(d.text);
}

async function withRetry(label, fn, attempts = 4) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (i >= attempts) throw new Error(`${label}: ${e.message} (after ${attempts} attempts)`);
      console.warn(`\n${label}: ${e.message} — retry ${i}/${attempts - 1}`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

async function main() {
  const pdfs = await inventory();
  const failed = await download(pdfs);
  if (failed.length) throw new Error(`Download failed:\n${failed.join('\n')}`);

  // ABC-nytt issues are `abcUtgave` (month + year); Dokumentsenter's documents get their category, title,
  // description, tun and order from dokumentsenter-data.mjs; the statutes and house rules from vedtekter-data.mjs
  const dokumenter = pdfs.map((d) => {
    const _localFile = path.join(CACHE, d.localFile);
    // Protocols are `generalforsamling` documents (date, ordinary/extraordinary)
    if (d.kategori === 'protokoller') return { ...tilGeneralforsamling({ tittel: title(d), dato: d.dato, gamleUrler: [d.oldPath] }), _localFile };
    if (d.kategori === 'abc-nytt') {
      const [aar, maaned] = d.dato.split('-').map(Number);
      return { _id: `abc-${d.dato.slice(0, 7)}`, _type: 'abcUtgave', aar, maaned, gamleUrler: [d.oldPath], _localFile };
    }
    const tittel = title(d);
    const felter = ['soknader-og-skjema', 'hms'].includes(d.kategori) ? dokumentFelter(tittel) : undefined;
    if (felter === null) throw new Error(`Dokumentsenter document not in dokumentsenter-data.mjs: ${tittel}`);
    const _id = `dokument-${slugify(d.oldPath.replace(/^\/images\/pdf\//, '').replace(/\.pdf$/i, ''))}`;
    return {
      _id,
      _type: 'dokument',
      tittel,
      kategori: { _type: 'reference', _ref: `kategori-${d.kategori}` },
      ...(d.dato && { dato: d.dato }),
      ...felter,
      // Statutes and house rules: description and "Sist endret" date (vedtekter-data.mjs)
      ...(d.kategori === 'vedtekter' && VEDTEKTER[_id]),
      gamleUrler: [d.oldPath],
      _gammelTittel: tittel,
      _localFile,
    };
  });
  const ids = new Set(dokumenter.map((d) => d._id));
  if (ids.size !== dokumenter.length) throw new Error('Duplicate dokument/abcUtgave/generalforsamling _id');
  const dokumentId = (tittel) => {
    const d = dokumenter.find((x) => x._gammelTittel === tittel);
    if (!d) throw new Error(`No document titled "${tittel}"`);
    return d._id;
  };

  const protokoll2026 = dokumenter.find((d) => d._type === 'generalforsamling' && d.gamleUrler[0].includes('28.05.2026'))?._id;
  if (!protokoll2026) throw new Error('2026 protocol not found');
  const docs = [...buildContent({ protokoll2026, dokumentId }), ...dokumenter];

  // Validate: every _ref points to a document in this import
  const all = new Set(docs.map((d) => d._id));
  const missing = [];
  JSON.stringify(docs, (k, v) => { if (k === '_ref' && !all.has(v)) missing.push(v); return v; });
  if (missing.length) throw new Error(`Dangling references: ${[...new Set(missing)].join(', ')}`);

  console.log(`Documents: ${docs.length} (${dokumenter.length} dokument)`);
  const byType = Object.groupBy(docs, (d) => d._type);
  console.log(Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, v.length])));

  if (DRY) {
    await fs.writeFile(path.join(CACHE, 'import.json'), JSON.stringify(docs.map(({ _gammelTittel, ...d }) => d), null, 2));
    console.log('Dry run — wrote cache/import.json');
    return;
  }

  const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
  if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
  const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false });

  // Upload files (Sanity dedupes identical files, so re-runs don't duplicate assets)
  let done = 0;
  const queue = [...dokumenter];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let d; (d = queue.shift()); ) {
      const asset = await withRetry(path.basename(d._localFile), async () =>
        client.assets.upload('file', await fs.readFile(d._localFile), { filename: path.basename(d._localFile) }));
      d[d._type === 'generalforsamling' ? 'protokoll' : 'fil'] = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } };
      process.stdout.write(`\rUploaded ${++done}/${dokumenter.length}`);
    }
  }));
  console.log();

  const tx = client.transaction();
  for (const { _localFile, _gammelTittel, ...doc } of docs) tx.createOrReplace(doc);
  await tx.commit({ visibility: 'async' });
  console.log('Import committed.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
