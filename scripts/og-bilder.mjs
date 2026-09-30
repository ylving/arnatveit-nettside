// Share images (Open Graph, 1200 × 630) in public/og/: one per news category, used when a post has no image of its
// own, and standard.png for every other page. Same look as the fallback illustration (NyhetIllustrasjon.astro):
// category tint, white circle with the category icon, the three-house mark at 16% cropped at the bottom right,
// plus the site name. Run again after changing categories, colours or the name, and commit the files:
//   node scripts/og-bilder.mjs
import fs from 'node:fs';
import { createCanvas, GlobalFonts, loadImage, Path2D } from '@napi-rs/canvas';
import { icons } from 'lucide';

const KATEGORIER = [
  // verdi, navn, [tint, colour] (the --farge-* tokens in global.css), Lucide icon (NYHET_KATEGORIER in sanity/standarder.ts)
  ['generalforsamling', 'Generalforsamling', ['#E4ECE6', '#2F5D4E'], 'Gavel'],
  ['dugnad', 'Dugnad', ['#F3E6D6', '#8A4E1F'], 'Sprout'],
  ['styret', 'Styret', ['#E1E8EE', '#35556E'], 'Users'],
  ['informasjon', 'Informasjon', ['#ECE6DA', '#5E5446'], 'Info'],
];
const HUS = [
  'M6 49V32L10 28V21H14V24L18 20L20.232 22.232L16.232 26.232A2.5 2.5 0 0 0 15.5 28V49Z',
  'M48.5 49V28A2.5 2.5 0 0 0 47.768 26.232L44.5 22.964V21.5L46 20L52 26V21H56V30L58 32V49Z',
  'M18 49V28L32 14L38 20V15H42V24L46 28V49Z',
];
const W = 1200, H = 630;

const fontDir = 'node_modules/@fontsource-variable';
const fil = (pakke, navn) => fs.readdirSync(`${fontDir}/${pakke}/files`).find((f) => f.startsWith(`${pakke}-latin-${navn}`) && f.endsWith('.woff2'));
GlobalFonts.registerFromPath(`${fontDir}/fraunces/files/${fil('fraunces', 'wght-normal') ?? fil('fraunces', 'full-normal')}`, 'Fraunces');
GlobalFonts.registerFromPath(`${fontDir}/figtree/files/${fil('figtree', 'wght-normal')}`, 'Figtree');

// A Lucide icon as an SVG image in `farge`
const ikon = (navn, farge, px) => {
  const node = icons[navn];
  if (!node) throw new Error(`Unknown Lucide icon ${navn}`);
  const indre = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return loadImage(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${farge}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${indre}</svg>`));
};

async function tegn(fil, { tint, farge, ikonNavn, overtittel }) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  // House mark, cropped at the bottom right (viewBox 5 13 54 37)
  const s = 15;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = farge;
  ctx.translate(W - 54 * s + 150 - 5 * s, H - 37 * s + 110 - 13 * s);
  ctx.scale(s, s);
  for (const d of HUS) ctx.fill(new Path2D(d));
  ctx.restore();
  // White circle with the icon
  const cx = 860, cy = 290, r = 130;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (ikonNavn) ctx.drawImage(await ikon(ikonNavn, farge, 108), cx - 54, cy - 54, 108, 108);
  // Text
  ctx.fillStyle = farge;
  ctx.font = '600 30px Figtree';
  ctx.fillText(overtittel.toUpperCase().split('').join(String.fromCharCode(8202)), 88, 250);
  ctx.fillStyle = '#1D2420';
  ctx.font = '400 76px Fraunces';
  ctx.fontVariationSettings = "'wght' 400, 'opsz' 72"; // the variable font's default instance is bold
  ctx.fillText('Arnatveit', 84, 350);
  ctx.fillText('Borettslag', 84, 432);
  fs.writeFileSync(fil, c.toBuffer('image/png'));
  console.log(fil);
}

fs.mkdirSync('public/og', { recursive: true });
for (const [verdi, navn, [tint, farge], ikonNavn] of KATEGORIER) await tegn(`public/og/${verdi}.png`, { tint, farge, ikonNavn, overtittel: `Aktuelt · ${navn}` });
await tegn('public/og/standard.png', { tint: '#E4ECE6', farge: '#2F5D4E', ikonNavn: 'House', overtittel: 'Rekkehus i tre tun i Arna' });
