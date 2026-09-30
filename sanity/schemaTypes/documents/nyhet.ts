import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { NYHET_KATEGORIER, nyhetKategori } from '../../standarder';

export const nyhet = defineType({
  name: 'nyhet',
  title: 'Nyhet',
  type: 'document',
  icon: lucideIkon('Newspaper'),
  groups: [
    { name: 'sak', title: 'Saken', default: true },
    { name: 'mer', title: 'Fakta, vedlegg og lenke' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', group: 'sak', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse',
      type: 'slug',
      group: 'sak',
      options: { source: 'tittel' },
      // /aktuelt/side/2 … are the listing's pages
      validation: (r) => r.required().custom((s) => (s?.current === 'side' ? '«side» brukes av nettsiden. Velg en annen adresse.' : true)),
    }),
    defineField({ name: 'dato', title: 'Dato', type: 'date', group: 'sak', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required() }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      type: 'string',
      group: 'sak',
      options: { list: NYHET_KATEGORIER.map((k) => ({ title: k.navn, value: k.verdi })), layout: 'radio', direction: 'horizontal' },
      initialValue: 'informasjon',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'ingress',
      title: 'Ingress',
      description: 'Et par setninger. Vises i listen, øverst i saken og når saken deles.',
      type: 'text',
      rows: 3,
      group: 'sak',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'bilde',
      title: 'Bilde (valgfritt)',
      description: 'Vises under ingressen og i listen. Uten bilde brukes en tegning i kategoriens farge.',
      type: 'image',
      group: 'sak',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alternativ tekst', description: 'Hva bildet viser, for skjermlesere.', type: 'string', validation: (r) => r.required() })],
    }),
    defineField({ name: 'innhold', title: 'Innhold', type: 'innhold', group: 'sak' }),
    defineField({
      name: 'fakta',
      title: 'Fakta (valgfritt)',
      description: 'En grønn boks under ingressen med dato og sted, f.eks. for et møte eller en dugnad.',
      type: 'object',
      group: 'mer',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'dato', title: 'Dato', type: 'date' }),
        defineField({ name: 'sted', title: 'Sted', type: 'string' }),
      ],
    }),
    defineField({ name: 'dokumenter', title: 'Vedlagte dokumenter', type: 'array', group: 'mer', of: [{ type: 'reference', to: [{ type: 'dokument' }, { type: 'generalforsamling' }] }] }),
    defineField({
      name: 'relatert',
      title: 'Lenke til en side (valgfri)',
      description: 'En lenkerad under saken, f.eks. «Alle protokoller».',
      type: 'object',
      group: 'mer',
      fields: [
        defineField({ name: 'side', title: 'Side', type: 'reference', to: [{ type: 'side' }] }),
        defineField({ name: 'tittel', title: 'Tekst', description: 'La stå tomt for å bruke sidens tittel.', type: 'string' }),
        defineField({ name: 'tekst', title: 'Tekst under', description: 'La stå tomt for å bruke kortteksten til siden.', type: 'string' }),
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  orderings: [{ title: 'Nyeste først', name: 'datoDesc', by: [{ field: 'dato', direction: 'desc' }] }],
  preview: {
    select: { title: 'tittel', dato: 'dato', kategori: 'kategori', media: 'bilde' },
    prepare: ({ title, dato, kategori, media }) => ({ title, subtitle: [nyhetKategori(kategori).navn, dato].join(' · '), media }),
  },
});
