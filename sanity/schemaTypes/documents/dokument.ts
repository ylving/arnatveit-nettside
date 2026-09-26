import { defineField, defineType } from 'sanity';

export const dokument = defineType({
  name: 'dokument',
  title: 'Dokument',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'fil', title: 'Fil', type: 'file', validation: (r) => r.required() }),
    defineField({ name: 'kategori', title: 'Kategori', type: 'reference', to: [{ type: 'dokumentkategori' }], validation: (r) => r.required() }),
    defineField({ name: 'dato', title: 'Dato', description: 'Brukes til sortering. Kun år? Velg 1. januar.', type: 'date' }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text', rows: 2 }),
    defineField({
      name: 'gamleUrler',
      title: 'Gamle adresser',
      description: 'Filsti på gammel nettside, f.eks. /images/pdf/Protokoller/gf_protokoll_2025.pdf',
      type: 'array',
      of: [{ type: 'string' }],
      readOnly: true,
    }),
  ],
  orderings: [{ title: 'Nyeste først', name: 'datoDesc', by: [{ field: 'dato', direction: 'desc' }] }],
  preview: { select: { title: 'tittel', kategori: 'kategori.tittel', dato: 'dato' }, prepare: ({ title, kategori, dato }) => ({ title, subtitle: [kategori, dato].filter(Boolean).join(' · ') }) },
});
