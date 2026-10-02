import { defineField, defineType } from 'sanity';

export const lenke = defineType({
  name: 'lenke',
  title: 'Lenke',
  type: 'object',
  fields: [
    defineField({ name: 'tekst', title: 'Tekst', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'intern',
      title: 'Intern side',
      type: 'reference',
      to: [{ type: 'side' }, { type: 'nyhet' }, { type: 'dokument' }, { type: 'generalforsamling' }, { type: 'oppgave' }],
      hidden: ({ parent }) => !!parent?.url,
    }),
    defineField({
      name: 'url',
      title: 'Ekstern adresse',
      description: 'Brukes hvis ingen intern side er valgt. Også mailto: og tel:',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
      hidden: ({ parent }) => !!parent?.intern,
    }),
  ],
  preview: { select: { title: 'tekst', subtitle: 'url' } },
});
