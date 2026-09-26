import { defineField, defineType } from 'sanity';

export const dokumentkategori = defineType({
  name: 'dokumentkategori',
  title: 'Dokumentkategori',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Nøkkel', type: 'slug', options: { source: 'tittel' }, validation: (r) => r.required() }),
    defineField({
      name: 'sortering',
      title: 'Sortering',
      type: 'string',
      options: { list: [{ title: 'Nyeste først', value: 'dato' }, { title: 'Alfabetisk', value: 'tittel' }], layout: 'radio' },
      initialValue: 'dato',
    }),
  ],
});
