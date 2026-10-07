import { defineField, defineType } from 'sanity';

export const forside = defineType({
  name: 'forside',
  title: 'Forside',
  type: 'document',
  fields: [
    defineField({ name: 'overtittel', title: 'Overtittel', description: 'F.eks. «Arna · Bergen»', type: 'string' }),
    defineField({ name: 'tittel', title: 'Hovedtittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'ingress', title: 'Ingress', type: 'text', rows: 3 }),
    defineField({ name: 'knapper', title: 'Knapper', type: 'array', of: [{ type: 'lenke' }], validation: (r) => r.max(2) }),
    defineField({
      name: 'bilde',
      title: 'Toppbilde',
      description: 'Erstatter illustrasjonen øverst på forsiden. Vises i format ca. 14:11 – bruk hotspot for å velge hva som alltid skal synes. La stå tomt for å vise illustrasjonen.',
      type: 'bilde',
    }),
    defineField({
      name: 'seksjoner',
      title: 'Seksjoner',
      description: 'Alt under toppen av forsiden. Dra for å endre rekkefølgen. En seksjon som fjernes, kan legges til igjen med «Legg til».',
      type: 'forsideSeksjoner',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Forside' }) },
});
