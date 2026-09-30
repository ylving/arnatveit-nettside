import { defineField, defineType } from 'sanity';
import { TUN } from '../../standarder';

export const dokument = defineType({
  name: 'dokument',
  title: 'Dokument',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'fil', title: 'Fil', type: 'file', validation: (r) => r.required() }),
    defineField({ name: 'kategori', title: 'Kategori', type: 'reference', to: [{ type: 'dokumentkategori' }], validation: (r) => r.required() }),
    defineField({ name: 'dato', title: 'Dato', description: 'Brukes til sortering. Kun år? Velg 1. januar.', type: 'date' }),
    defineField({
      name: 'beskrivelse',
      title: 'Beskrivelse',
      description: 'Valgfri, én kort linje. Vises under tittelen i dokumentlistene, f.eks. «Fyll ut og legg i borettslagets postkasse i A-tunet».',
      type: 'text',
      rows: 2,
      validation: (r) => r.max(80).warning('Hold beskrivelsen under 80 tegn, så den får plass på én linje.'),
    }),
    defineField({
      name: 'tun',
      title: 'Tun',
      description: 'Valgfritt. Vises som et lite merke ved dokumentet, f.eks. på sjekklister for lekeplasser. «Felles» er fellesarealene.',
      type: 'string',
      options: { list: [...TUN], layout: 'radio', direction: 'horizontal' },
    }),
    defineField({
      name: 'rekkefolge',
      title: 'Rekkefølge',
      description: 'Lavest først. Brukes når kategorien er sortert etter «Egen rekkefølge».',
      type: 'number',
    }),
    defineField({
      name: 'gamleUrler',
      title: 'Gamle adresser',
      description: 'Filsti på gammel nettside, f.eks. /images/pdf/Protokoller/gf_protokoll_2025.pdf',
      type: 'array',
      of: [{ type: 'string' }],
      readOnly: true,
    }),
  ],
  orderings: [
    { title: 'Nyeste først', name: 'datoDesc', by: [{ field: 'dato', direction: 'desc' }] },
    { title: 'Rekkefølge', name: 'rekkefolgeAsc', by: [{ field: 'rekkefolge', direction: 'asc' }, { field: 'tittel', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'tittel', kategori: 'kategori.tittel', dato: 'dato', tun: 'tun' },
    prepare: ({ title, kategori, dato, tun }) => ({ title, subtitle: [kategori, tun, dato].filter(Boolean).join(' · ') }),
  },
});
