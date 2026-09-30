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
        defineField({ name: 'tekst', title: 'Tekst', description: 'Kort, én linje. Lenken kan gå til en nyhet (Intern side).', type: 'string' }),
        defineField({
          name: 'utloper',
          title: 'Vis til og med',
          description: 'Valgfritt. Banneret forsvinner av seg selv natten etter denne datoen.',
          type: 'date',
        }),
        defineField({
          name: 'sisteProtokoll',
          title: 'Lenk til protokollen fra siste generalforsamling',
          description: 'Lenken går da alltid til den nyeste protokollen under Generalforsamlinger. Lenketeksten tas fra «Lenke», ellers «Les protokollen».',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'lenke',
          title: 'Lenke',
          type: 'lenke',
          description: 'Står «Lenk til protokollen …» på, brukes bare teksten herfra.',
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Innstillinger' }) },
});
