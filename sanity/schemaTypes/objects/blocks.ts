import { defineArrayMember, defineField, defineType } from 'sanity';
import { STANDARD_BREDDE } from '../../standarder';
import { lucideIkon } from '../../components/LucideIkon';

/** Width of a page section. Hidden when the same block sits inside news text (`nyhet.innhold`). */
export const breddeFelt = (type: keyof typeof STANDARD_BREDDE) =>
  defineField({
    name: 'bredde',
    title: 'Bredde',
    type: 'string',
    options: {
      list: [
        { title: 'Tekstbredde', value: 'tekst' },
        { title: 'Breakout', value: 'breakout' },
        { title: 'Bred', value: 'bred' },
        ...(type === 'bilde' ? [{ title: 'Full bredde', value: 'full' }] : []),
      ],
      layout: 'radio',
      direction: 'horizontal',
    },
    initialValue: STANDARD_BREDDE[type],
    // Only on pages: news items use the article column
    hidden: ({ path, document }) => path[0] !== 'seksjoner' || document?._type !== 'side',
  });

/** Link annotation for rich text (internal document or external/mailto/tel) */
export const lenkeAnnotasjon = {
  name: 'link',
  type: 'object',
  title: 'Lenke',
  fields: [
    { name: 'intern', title: 'Intern', type: 'reference', to: [{ type: 'side' }, { type: 'nyhet' }, { type: 'dokument' }, { type: 'generalforsamling' }] },
    { name: 'href', title: 'Adresse', type: 'url', validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }) },
  ],
};

export const bilde = defineType({
  name: 'bilde',
  title: 'Bilde',
  type: 'image',
  icon: lucideIkon('Image'),
  options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Alternativ tekst', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'bildetekst', title: 'Bildetekst', type: 'string' }),
    breddeFelt('bilde'),
  ],
  preview: { select: { media: 'asset', title: 'bildetekst', subtitle: 'alt' }, prepare: ({ media, title, subtitle }) => ({ media, title: title || subtitle || 'Bilde', subtitle: 'Bilde' }) },
});

export const dokumentliste = defineType({
  name: 'dokumentliste',
  title: 'Dokumenter',
  type: 'object',
  icon: lucideIkon('Files'),
  description: 'Dokumentene i én eller flere kategorier: som liste, som tidslinje etter år, eller gruppert etter kategori med søk og filter.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', description: 'La stå tom når listen hører til teksten over, uten egen overskrift.', type: 'string' }),
    defineField({
      name: 'kategorier',
      title: 'Kategorier',
      description: 'Dra for å endre rekkefølgen. Med flere kategorier i en liste kommer dokumentene kategori for kategori.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'dokumentkategori' }] })],
      validation: (r) => r.required().min(1).unique(),
    }),
    defineField({
      name: 'visning',
      title: 'Visning',
      type: 'string',
      options: {
        list: [
          { title: 'Liste', value: 'liste' },
          { title: 'Tidslinje etter år (som Protokoller)', value: 'tidslinje' },
          { title: 'Gruppert etter kategori, med søk og filter (som Dokumentsenter)', value: 'sok' },
        ],
        layout: 'radio',
      },
      initialValue: 'liste',
      description: 'Tidslinjen og søket ser best ut med Bredde «Bred» eller «Breakout».',
    }),
    breddeFelt('dokumentliste'),
  ],
  preview: {
    select: { title: 'tittel', a: 'kategorier.0.tittel', b: 'kategorier.1.tittel', c: 'kategorier.2.tittel', visning: 'visning' },
    prepare: ({ title, a, b, c, visning }) => ({
      title: title || a || 'Dokumenter',
      subtitle: `Dokumenter${visning === 'tidslinje' ? ' (tidslinje)' : visning === 'sok' ? ' (med søk)' : ''} · ${[a, b, c].filter(Boolean).join(', ')}`,
    }),
  },
});

export const medlemsliste = defineType({
  name: 'medlemsliste',
  title: 'Medlemsliste',
  type: 'object',
  icon: lucideIkon('Users'),
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', description: 'F.eks. «Styremedlemmer». Varamedlemmer får automatisk en egen liste.', type: 'string' }),
    defineField({ name: 'ingress', title: 'Tekst under overskriften (valgfri)', type: 'string' }),
    defineField({ name: 'utvalg', title: 'Utvalg', type: 'reference', to: [{ type: 'utvalg' }], validation: (r) => r.required() }),
    defineField({
      name: 'visning',
      title: 'Visning',
      type: 'string',
      options: {
        list: [
          { title: 'Rader med kontaktinfo', value: 'rader' },
          { title: 'Navn gruppert etter tun', value: 'tun' },
        ],
        layout: 'radio',
      },
      initialValue: 'rader',
    }),
    breddeFelt('medlemsliste'),
  ],
  preview: {
    select: { tittel: 'tittel', utvalg: 'utvalg.navn', medlemmer: 'utvalg.medlemmer' },
    prepare: ({ tittel, utvalg, medlemmer }) => ({ title: tittel || utvalg, subtitle: `Medlemsliste · ${utvalg ?? ''}${Array.isArray(medlemmer) ? ` · ${medlemmer.length} medlemmer` : ''}` }),
  },
});

export const nokkeltall = defineType({
  name: 'nokkeltall',
  title: 'Nøkkeltall',
  type: 'object',
  icon: lucideIkon('Hash'),
  description: 'Store tall med en kort tekst under, f.eks. «150 kr» – «per time for voksne».',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string' }),
    defineField({
      name: 'tall',
      title: 'Tall',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tallrad',
          fields: [
            defineField({ name: 'verdi', title: 'Tall', description: 'F.eks. «150 kr»', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tekst', title: 'Tekst', description: 'F.eks. «per time for voksne og barn over 13 år»', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'verdi', subtitle: 'tekst' } },
        }),
      ],
      validation: (r) => r.required().min(1).max(4),
    }),
    breddeFelt('nokkeltall'),
  ],
  preview: {
    select: { tittel: 'tittel', a: 'tall.0.verdi', b: 'tall.1.verdi', c: 'tall.2.verdi' },
    prepare: ({ tittel, a, b, c }) => ({ title: tittel || 'Nøkkeltall', subtitle: `Nøkkeltall · ${[a, b, c].filter(Boolean).join(' · ')}` }),
  },
});

export const kontaktinfo = defineType({
  name: 'kontaktinfo',
  title: 'Kontaktinfo',
  type: 'object',
  icon: lucideIkon('Contact'),
  description: 'E-post til styret, kontaktperson og adresser fra «Om borettslaget». Kontaktpersonen er den som har «Kontaktperson for borettslaget» slått på under Styre og utvalg.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', description: 'Brukes også som snarvei øverst på siden.', type: 'string', initialValue: 'Kontakt' }),
    defineField({ name: 'visKart', title: 'Vis kartlenke', type: 'boolean', initialValue: true }),
    defineField({
      name: 'lenker',
      title: 'Lenker under adressene',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'kontaktlenke',
          fields: [
            defineField({ name: 'tittel', title: 'Tittel', description: 'F.eks. «Hvem kontakter jeg?»', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tekst', title: 'Tekst', description: 'F.eks. «Se hele styret, og hvem som har ansvar for hva»', type: 'string' }),
            defineField({ name: 'side', title: 'Side', type: 'reference', to: [{ type: 'side' }], validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'tittel', subtitle: 'side.tittel' } },
        }),
      ],
      validation: (r) => r.max(4),
    }),
    breddeFelt('kontaktinfo'),
  ],
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'Kontaktinfo', subtitle: 'Kontaktinfo (fra «Om borettslaget»)' }) },
});
