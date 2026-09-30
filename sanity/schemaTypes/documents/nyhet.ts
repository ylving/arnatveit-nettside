import { defineField, defineType } from 'sanity';

export const nyhet = defineType({
  name: 'nyhet',
  title: 'Nyhet',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Adresse', type: 'slug', options: { source: 'tittel' }, validation: (r) => r.required() }),
    defineField({ name: 'dato', title: 'Dato', type: 'date', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required() }),
    defineField({ name: 'merkelapp', title: 'Merkelapp', description: 'F.eks. «Generalforsamling 2026»', type: 'string' }),
    defineField({ name: 'ingress', title: 'Ingress', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'innhold', title: 'Innhold', type: 'innhold' }),
    defineField({ name: 'dokumenter', title: 'Vedlagte dokumenter', type: 'array', of: [{ type: 'reference', to: [{ type: 'dokument' }, { type: 'generalforsamling' }] }] }),
    defineField({ name: 'fremhevet', title: 'Fremhev på forsiden', type: 'boolean', initialValue: false }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [{ title: 'Nyeste først', name: 'datoDesc', by: [{ field: 'dato', direction: 'desc' }] }],
  preview: { select: { title: 'tittel', subtitle: 'dato' } },
});
