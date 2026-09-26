import { defineArrayMember, defineField, defineType } from 'sanity';

export const utvalg = defineType({
  name: 'utvalg',
  title: 'Styre og utvalg',
  type: 'document',
  fields: [
    defineField({ name: 'navn', title: 'Navn', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text', rows: 2 }),
    defineField({
      name: 'medlemmer',
      title: 'Medlemmer',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'medlem',
          fields: [
            defineField({ name: 'navn', title: 'Navn', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'rolle', title: 'Rolle', type: 'string' }),
            defineField({ name: 'tun', title: 'Tun', type: 'string', options: { list: ['A-tunet', 'B-tunet', 'C-tunet', 'Ekstern'] } }),
            defineField({ name: 'telefon', title: 'Telefon', type: 'string' }),
            defineField({ name: 'epost', title: 'E-post', type: 'email' }),
          ],
          preview: { select: { title: 'navn', subtitle: 'rolle' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'navn', medlemmer: 'medlemmer' }, prepare: ({ title, medlemmer }) => ({ title, subtitle: `${medlemmer?.length ?? 0} medlemmer` }) },
});
