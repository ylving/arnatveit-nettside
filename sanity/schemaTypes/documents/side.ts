import { defineField, defineType } from 'sanity';
import { ikonValg } from '../../ikoner';

export const side = defineType({
  name: 'side',
  title: 'Side',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse',
      type: 'slug',
      options: { source: 'tittel' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'seksjon',
      title: 'Seksjon',
      description: 'Sider under Praktisk info får adressen /praktisk-info/…',
      type: 'string',
      options: { list: [{ title: 'Toppnivå', value: 'topp' }, { title: 'Praktisk info', value: 'praktisk-info' }], layout: 'radio' },
      initialValue: 'topp',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'ikon', title: 'Ikon', type: 'string', options: { list: ikonValg }, hidden: ({ document }) => document?.seksjon !== 'praktisk-info' }),
    defineField({ name: 'rekkefolge', title: 'Rekkefølge', type: 'number', initialValue: 100 }),
    defineField({ name: 'kort', title: 'Korttekst', description: 'Kort beskrivelse på kortet under Praktisk info', type: 'string', hidden: ({ document }) => document?.seksjon !== 'praktisk-info' }),
    defineField({ name: 'ingress', title: 'Ingress', type: 'text', rows: 3 }),
    defineField({ name: 'innhold', title: 'Innhold', type: 'innhold' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
    defineField({
      name: 'gamleUrler',
      title: 'Gamle adresser',
      description: 'Adresser fra gammel nettside som skal videresendes hit, f.eks. /praktiskinfo/styret',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  orderings: [{ title: 'Rekkefølge', name: 'rekkefolge', by: [{ field: 'rekkefolge', direction: 'asc' }] }],
  preview: { select: { title: 'tittel', seksjon: 'seksjon', slug: 'slug.current' }, prepare: ({ title, seksjon, slug }) => ({ title, subtitle: seksjon === 'praktisk-info' ? `/praktisk-info/${slug}` : `/${slug}` }) },
});
