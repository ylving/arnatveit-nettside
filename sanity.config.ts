import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';
import { structure, singletonTypes } from './sanity/structure';
import { medVideresending } from './sanity/actions/publiserMedVideresending';

const env = import.meta.env ?? {};

export default defineConfig({
  name: 'default',
  title: 'Arnatveit Borettslag',
  // PUBLIC_* in the Astro-embedded Studio, SANITY_STUDIO_* for the Sanity CLI (schema validate, deploy, etc.)
  projectId: env.PUBLIC_SANITY_PROJECT_ID ?? env.SANITY_STUDIO_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET ?? env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from "New document"
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) => {
      if (singletonTypes.has(schemaType)) return actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action));
      // Pages: record the old address when a page moves, so it gets a redirect
      if (schemaType === 'side') return actions.map((a) => (a.action === 'publish' ? medVideresending(a) : a));
      return actions;
    },
  },
});
