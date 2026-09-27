# Arnatveit Borettslag – logo

Mark: "Tre tun" (three houses, one per tun). Icon: "Tunmerket" (the same houses in a rounded tile with an evening sun).
The gaps between the houses are real cutouts, so every SVG works on any background with no masks or strokes.

## Files

| File | Use |
|---|---|
| `arnatveit-logo.svg` | Main mark on light backgrounds (site header, documents) |
| `arnatveit-logo-on-dark.svg` | Main mark on the pine green background (footer, dark sections) |
| `arnatveit-logo-mono.svg` | One colour, `fill="currentColor"`. Inline it and colour it with CSS |
| `arnatveit-icon.svg` | Rounded icon. Use as `favicon.svg` |
| `icon-square.svg` | Square, full-bleed icon (source for app icons) |
| `favicon.ico` | 16/32/48 px fallback for old browsers |
| `apple-touch-icon.png` | 180 × 180, iOS home screen |
| `icon-192.png`, `icon-512.png` | Web app manifest icons |
| `arnatveit-logo-1024.png`, `arnatveit-logo-on-dark-1024.png` | Raster versions for Word, email signatures, etc. |

## Colours

| Token | Hex | Where |
|---|---|---|
| Pine (accent) | `#2F5D4E` | Front house, icon tile |
| Sage | `#7FA08F` | Left house |
| Mist | `#C3D6C9` | Right house |
| Off-white | `#F6F3EC` | Page background, houses in the icon |
| Sun | `#E0A458` | Sun in the icon |
| On dark: left / right | `#B9D0C1` / `#7FA591` | Houses in `arnatveit-logo-on-dark.svg` |

## Usage

- Minimum size: main mark 24 px tall; below that, use the icon.
- Clear space: at least the width of a chimney's gap on every side (about 10% of the mark's height).
- The wordmark is plain text: "Arnatveit Borettslag" in Fraunces 600, set next to the mark.

## Suggested Astro setup

- Put `favicon.svg` (renamed `arnatveit-icon.svg`), `favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` in `public/`.
- Put the logo SVGs in `src/assets/brand/` and inline them in the header and footer components.
- In the base layout `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#2F5D4E">
```
