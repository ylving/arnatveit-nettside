// Build only: hides email addresses in the built HTML from simple scrapers. "mailto:" and the part up to and
// including "@" become HTML entities (browsers and screen readers show the normal address; copying gives it
// unchanged), and in JSON-LD the "@" becomes @ (same value once parsed). Other scripts and styles are left alone.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// "styret@" followed by a domain, or by <wbr> (the Epost component's line-break hint)
const ADRESSE = /[A-Za-z0-9._%+-]+@(?=<wbr|[A-Za-z0-9-]+\.)/g;
const BLOKK = /(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i;

const entiteter = (s) => [...s].map((c) => `&#${c.codePointAt(0)};`).join('');

export const skjulEpost = (html) =>
  html
    .split(BLOKK)
    .map((del, i) => {
      if (i % 2 === 0) return del.replace(/mailto:/g, entiteter).replace(ADRESSE, entiteter);
      if (/^<script[^>]*application\/ld\+json/i.test(del)) return del.replace(ADRESSE, (m) => m.replace('@', '\\u0040'));
      return del;
    })
    .join('');

export default function skjulEpostIntegrasjon() {
  return {
    name: 'skjul-epost',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const rot = fileURLToPath(dir);
        const filer = (await readdir(rot, { recursive: true })).filter((f) => f.endsWith('.html'));
        let endret = 0;
        for (const f of filer) {
          const sti = join(rot, f);
          const html = await readFile(sti, 'utf8');
          const ny = skjulEpost(html);
          if (ny === html) continue;
          await writeFile(sti, ny);
          endret++;
        }
        logger.info(`E-postadresser skjult i ${endret} av ${filer.length} HTML-filer`);
      },
    },
  };
}
