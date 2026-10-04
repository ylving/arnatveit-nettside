// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import sanityDevRefresh from './integrations/sanity-dev-refresh.mjs';
import skjulEpost from './integrations/skjul-epost.mjs';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');

// Fully static for now. Resident login / booking will add the Cloudflare adapter (see docs/ROADMAP.md).
export default defineConfig({
  site: 'https://www.arnatveit-borettslag.no',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Build start time, for /bygg.json (the Studio compares it with when content was published)
  vite: { define: { __BYGG_TID__: JSON.stringify(new Date().toISOString()) } },
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET ?? 'production',
      useCdn: false,
      apiVersion: '2026-09-01',
      studioBasePath: '/admin',
      studioRouterHistory: 'hash',
    }),
    react(),
    sanityDevRefresh({ projectId: PUBLIC_SANITY_PROJECT_ID, dataset: PUBLIC_SANITY_DATASET ?? 'production', apiVersion: '2026-09-01' }),
    skjulEpost(),
  ],
});
