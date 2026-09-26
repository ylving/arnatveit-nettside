import { defineField, defineType } from 'sanity';

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'tittel', title: 'Tittel i søkeresultat', type: 'string', validation: (r) => r.max(70) }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text', rows: 3, validation: (r) => r.max(160) }),
  ],
});
