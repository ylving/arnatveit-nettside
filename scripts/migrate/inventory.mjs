// Step 1: fetch old pages (cached), extract every PDF link → cache/pdfs.json, download PDFs → cache/files/
import * as cheerio from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';

const OLD = 'https://www.arnatveit-borettslag.no';
const CACHE = new URL('./cache/', import.meta.url).pathname;
export const OLD_PAGES = [
  '/', '/om-borettslaget', '/kontakt-oss',
  '/praktiskinfo/generalforsamling', '/praktiskinfo/vedtekter', '/praktiskinfo/styret', '/praktiskinfo/abc-nytt',
  '/praktiskinfo/dugnad', '/praktiskinfo/miljoutvalget', '/praktiskinfo/dokumentsenter',
];

const MONTHS = { januar: 1, jan: 1, februar: 2, feb: 2, mars: 3, mar: 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11, desember: 12, des: 12, dec: 12 };

function category(p) {
  const l = p.toLowerCase();
  if (l.includes('/abc_nytt/') || l.includes('/abc-nytt/')) return 'abc-nytt';
  if (l.includes('/protokoller/')) return 'protokoller';
  if (l.includes('/aarsberetninger/')) return 'arsberetninger';
  if (l.includes('/hms')) return 'hms';
  if (l.includes('/dokumentsenter/')) return 'soknader-og-skjema';
  if (l.includes('/vedtekter/')) return 'vedtekter';
  if (l.includes('/dugnad/')) return 'dugnad';
  return 'annet';
}

// Best-effort date from link text + filename. Returns YYYY-MM-DD or null.
function guessDate(text, file) {
  const full = `${text} ${file}`.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (full) return `${full[3]}-${full[2].padStart(2, '0')}-${full[1].padStart(2, '0')}`;
  const compact = file.match(/(\d{2})(\d{2})(20\d{2})/); // 12022012
  if (compact) return `${compact[3]}-${compact[2]}-${compact[1]}`;
  const s = `${text} ${file}`.toLowerCase().replace(/%20|[_\-.]+/g, ' ');
  const year = s.match(/\b(19[89]\d|20\d{2})\b/)?.[1] ?? file.match(/(19[89]\d|20\d{2})/)?.[1];
  if (!year) return null;
  const month = Object.keys(MONTHS).sort((a, b) => b.length - a.length).find((m) => new RegExp(`\\b${m}\\b`).test(s));
  return `${year}-${String(month ? MONTHS[month] : 1).padStart(2, '0')}-01`;
}

async function cached(url, file, binary = false) {
  const target = path.join(CACHE, file);
  try { return binary ? await fs.readFile(target) : await fs.readFile(target, 'utf8'); } catch {}
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
  return body;
}

export async function inventory() {
  const found = new Map();
  for (const page of OLD_PAGES) {
    const html = await cached(OLD + page, `html${page === '/' ? '/index' : page}.html`);
    const $ = cheerio.load(html);
    $('script').remove(); // old site is compromised — never carry scripts over
    $('#sp-component a[href*=".pdf"]').each((_, a) => {
      const oldPath = decodeURI(new URL($(a).attr('href'), OLD).pathname);
      if (found.has(oldPath)) return;
      const text = $(a).text().replace(/\s+/g, ' ').trim();
      const kategori = category(oldPath);
      // ABC-nytt: year folder is authoritative (filenames like "ABC nov-18.pdf"), link text is the month
      const folderYear = oldPath.match(/\/(\d{4})\/[^/]+$/)?.[1];
      const dato = kategori === 'abc-nytt' && folderYear ? guessDate(`${text} ${folderYear}`, '') : guessDate(text, path.basename(oldPath));
      found.set(oldPath, { oldPath, text, page, kategori, dato });
    });
  }
  const list = [...found.values()];
  await fs.writeFile(path.join(CACHE, 'pdfs.json'), JSON.stringify(list, null, 2));
  return list;
}

export async function download(list) {
  const failed = [];
  for (const d of list) {
    d.localFile = path.join('files', d.oldPath);
    try { await cached(OLD + encodeURI(d.oldPath), d.localFile, true); }
    catch (e) { failed.push(`${d.oldPath}: ${e.message}`); d.localFile = null; }
  }
  await fs.writeFile(path.join(CACHE, 'pdfs.json'), JSON.stringify(list, null, 2));
  return failed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = await inventory();
  const counts = Object.groupBy(list, (d) => d.kategori);
  console.log('PDFs:', list.length, Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.length])));
  console.log('No date:', list.filter((d) => !d.dato).map((d) => d.oldPath));
  if (process.argv.includes('--download')) {
    const failed = await download(list);
    console.log('Download failures:', failed.length ? failed : 'none');
  }
}
