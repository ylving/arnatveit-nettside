import { defineField, defineType } from 'sanity';
import { MENY_BRYTEPUNKT } from '../../standarder';

export const innstillinger = defineType({
  name: 'innstillinger',
  title: 'Innstillinger',
  type: 'document',
  groups: [
    { name: 'generelt', title: 'Generelt', default: true },
    { name: 'banner', title: 'Banner' },
    { name: 'kontakt', title: 'Kontakt' },
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
    defineField({
      name: 'kontakt',
      title: 'Kontakt',
      type: 'object',
      group: 'kontakt',
      fields: [
        defineField({ name: 'epost', title: 'E-post styret', type: 'email' }),
        defineField({ name: 'postadresse', title: 'Postadresse', type: 'text', rows: 3 }),
        defineField({ name: 'besoksadresse', title: 'Besøksadresse', type: 'text', rows: 2 }),
        defineField({ name: 'fakturaadresse', title: 'Fakturaadresse', type: 'text', rows: 4 }),
        defineField({ name: 'fakturaEpost', title: 'E-post faktura', type: 'email' }),
        defineField({ name: 'orgnr', title: 'Organisasjonsnummer', type: 'string' }),
        defineField({ name: 'kartlenke', title: 'Kartlenke', type: 'url' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Innstillinger' }) },
});
