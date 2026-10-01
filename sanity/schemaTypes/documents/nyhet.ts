// A news item: the essentials as fields (they drive the listing, the front page, the article header and shared links),
// the body as a list of blocks like on pages, and attachments, which are always shown last.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';

export const nyhet = defineType({
  name: 'nyhet',
  title: 'Nyhet',
  type: 'document',
  icon: lucideIkon('Newspaper'),
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse',
      type: 'slug',
      options: { source: 'tittel' },
      // /aktuelt/side/2 … are the listing's pages
      validation: (r) => r.required().custom((s) => (s?.current === 'side' ? '«side» brukes av nettsiden. Velg en annen adresse.' : true)),
    }),
    defineField({ name: 'dato', title: 'Dato', type: 'date', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required() }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      description: 'Nye kategorier lages under Nyheter → Kategorier.',
      type: 'reference',
      to: [{ type: 'nyhetskategori' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'ingress',
      title: 'Ingress',
      description: 'Et par setninger. Vises i listen, øverst i saken og når saken deles.',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'bilde',
      title: 'Hovedbilde (valgfritt)',
      description: 'Vises under ingressen, i listen og når saken deles. Uten bilde brukes en tegning i kategoriens farge.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alternativ tekst', description: 'Hva bildet viser, for skjermlesere.', type: 'string', validation: (r) => r.required() })],
    }),
    defineField({
      name: 'fakta',
      title: 'Dato og sted (valgfritt)',
      description: 'For et møte, en dugnad eller et arrangement. Vises som hvite merker øverst i saken.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'dato', title: 'Dato', type: 'date' }),
        defineField({ name: 'sted', title: 'Sted', type: 'string' }),
      ],
    }),
    defineField({
      name: 'seksjoner',
      title: 'Innhold',
      description: 'Tekst, bilder, faktaboks og lenker, i den rekkefølgen du vil.',
      type: 'array',
      of: [
        defineArrayMember({ type: 'tekst' }),
        defineArrayMember({ type: 'bilde' }),
        defineArrayMember({ type: 'faktaboks' }),
        defineArrayMember({ type: 'relatert' }),
      ],
      options: { insertMenu: { showIcons: true, views: [{ name: 'list' }] } },
    }),
    defineField({
      name: 'dokumenter',
      title: 'Vedlegg',
      description: 'PDF-er som vises nederst i saken, under «Vedlegg». Det første blir også en knapp på forsiden.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'dokument' }, { type: 'generalforsamling' }] }],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [{ title: 'Nyeste først', name: 'datoDesc', by: [{ field: 'dato', direction: 'desc' }] }],
  preview: {
    select: { title: 'tittel', dato: 'dato', kategori: 'kategori.tittel', media: 'bilde' },
    prepare: ({ title, dato, kategori, media }) => ({ title, subtitle: [kategori, dato].filter(Boolean).join(' · '), media }),
  },
});
