// One-off: covers for ABC-nytt issues that have none, rendered from the PDF's first page like the Studio does
// (sanity/components/AbcForsideInput.tsx: 800px wide JPEG, marked as generated so a later PDF swap regenerates it).
//   node --env-file=.env scripts/abc-forsider.mjs --dry [antall]   render the newest issue(s) to the scratch dir, write nothing
//   node --env-file=.env scripts/abc-forsider.mjs                  render, upload and set `forside` on every issue without one
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const { PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-09-01', useCdn: false, perspective: 'raw' });
const BREDDE = 800;
const SAMTIDIG = 4;

async function forside(url) {
  const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const lasting = getDocument({ data, isEvalSupported: false });
  try {
    const pdf = await lasting.promise;
    const side = await pdf.getPage(1);
    const viewport = side.getViewport({ scale: BREDDE / side.getViewport({ scale: 1 }).width });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await side.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas.encode('jpeg', 85);
  } finally {
    await lasting.destroy();
  }
}

const tørr = process.argv.includes('--dry');
const utgaver = await client.fetch(`*[_type == "abcUtgave" && !(_id in path("drafts.**")) && defined(fil.asset) && !defined(forside.asset)]
  | order(aar desc, maaned desc){ _id, _rev, aar, maaned, "fil": fil.asset._ref, "url": fil.asset->url }`);
console.log(`${utgaver.length} issues without a cover.`);

if (tørr) {
  const n = Number(process.argv[process.argv.indexOf('--dry') + 1]) || 1;
  const mappe = fs.mkdtempSync(path.join(os.tmpdir(), 'abc-forsider-'));
  for (const u of utgaver.slice(0, n)) {
    const fil = path.join(mappe, `${u._id}.jpg`);
    fs.writeFileSync(fil, await forside(u.url));
    console.log(`  ${u._id} → ${fil}`);
  }
  console.log('Dry run, nothing uploaded.');
  process.exit(0);
}

let ferdig = 0;
const feil = [];
const kø = [...utgaver];
await Promise.all(Array.from({ length: SAMTIDIG }, async () => {
  for (let u; (u = kø.shift()); ) {
    try {
      const asset = await client.assets.upload('image', await forside(u.url), { filename: `abc-nytt-forside-${u.aar}-${String(u.maaned).padStart(2, '0')}.jpg` });
      await client.patch(u._id).ifRevisionId(u._rev).set({ forside: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, fraFil: u.fil, autoBilde: asset._id } }).commit();
      console.log(`  ${++ferdig}/${utgaver.length} ${u._id}`);
    } catch (e) {
      feil.push(u._id);
      console.error(`  ✗ ${u._id}: ${e.message}`);
    }
  }
}));
console.log(`Done: ${ferdig} covers${feil.length ? `, ${feil.length} failed (${feil.join(', ')}); run again to retry` : ''}.`);
if (feil.length) process.exitCode = 1;
