import { defineField, defineType } from 'sanity';
import { MENY_BRYTEPUNKT } from '../../standarder';

export const innstillinger = defineType({
  name: 'innstillinger',
  title: 'Innstillinger',
  type: 'document',
  groups: [
    { name: 'generelt', title: 'Generelt', default: true },
    { name: 'banner', title: 'Banner' },
  ],
  fields: [
    defineField({ name: 'navn', title: 'Navn', type: 'string', group: 'generelt', validation: (r) => r.required() }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', description: 'Standard metabeskrivelse og tekst i bunnteksten', type: 'text', rows: 2, group: 'generelt' }),
    defineField({ name: 'hovedmeny', title: 'Hovedmeny', type: 'array', of: [{ type: 'lenke' }], group: 'generelt' }),
    defineField({
      name: 'menyBrytepunkt',
      title: 'Brytepunkt for mobilmeny (px)',
      description: `Under denne skjermbredden vises hovedmenyen som en menyknapp. Øk tallet hvis menypunktene ikke får plass på én linje. Står feltet tomt, brukes ${MENY_BRYTEPUNKT}.`,
      type: 'number',
      group: 'generelt',
      placeholder: String(MENY_BRYTEPUNKT),
      validation: (r) => r.integer().min(600).max(1600),
    }),
    defineField({
      name: 'banner',
      title: 'Banner øverst',
      type: 'object',
      group: 'banner',
      fields: [
        defineField({ name: 'aktiv', title: 'Vis banner', type: 'boolean', initialValue: false }),
        defineField({ name: 'tekst', title: 'Tekst', type: 'string' }),
        defineField({ name: 'lenke', title: 'Lenke', type: 'lenke' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Innstillinger' }) },
});
