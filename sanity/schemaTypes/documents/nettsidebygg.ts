// Trigger for rebuilding the site. The "Oppdater nettsiden" button writes this one document; the Sanity webhook
// fires only for this type, so publishing content no longer rebuilds the site by itself.
import { defineField, defineType } from 'sanity';

export const BYGG_ID = 'nettsidebygg';

export const nettsidebygg = defineType({
  name: 'nettsidebygg',
  title: 'Oppdatering av nettsiden',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'tidspunkt', title: 'Bestilt', type: 'datetime' }),
    defineField({ name: 'av', title: 'Av', type: 'string' }),
  ],
});
