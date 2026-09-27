// Lucide icons as React components for the Studio (icon picker, schema type icons)
import { createElement } from 'react';
import { ikonNode } from '../ikoner';

export function IkonSvg({ navn, size = 24 }: { navn?: string; size?: number | string }) {
  return createElement(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    ikonNode(navn).map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
  );
}

/** For schema types: `icon: lucideIkon('FileText')` (sized like Sanity's own icons) */
export function lucideIkon(navn: string) {
  const Ikon = () => createElement(IkonSvg, { navn, size: '1em' });
  Ikon.displayName = `LucideIkon(${navn})`;
  return Ikon;
}
