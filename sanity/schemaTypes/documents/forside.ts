import { defineArrayMember, defineField, defineType } from 'sanity';
import { IkonVelger } from '../../components/IkonVelger';

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
      name: 'infokort',
      title: 'Infokort i toppen',
      type: 'object',
      fields: [
        defineField({ name: 'tittel', title: 'Tittel', type: 'string' }),
        defineField({ name: 'tekst', title: 'Tekst', type: 'string' }),
      ],
    }),
    defineField({
      name: 'faktaseksjon',
      title: 'Faktaseksjon – tekst',
      description: 'Venstre side av det grønne båndet med faktakortene.',
      type: 'object',
      fields: [
        defineField({ name: 'overtittel', title: 'Overtittel', type: 'string', placeholder: 'Å bo her' }),
        defineField({ name: 'tittel', title: 'Overskrift', type: 'string', placeholder: 'Tre tun, ett nabolag' }),
        defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 3 }),
      ],
    }),
    defineField({
      name: 'fakta',
      title: 'Faktakort',
      type: 'array',
      validation: (r) => r.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faktakort',
          fields: [
            defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tekst', title: 'Tekst', type: 'string' }),
            defineField({ name: 'logo', title: 'Bruk logoen som ikon', type: 'boolean', initialValue: false }),
            defineField({ name: 'ikon', title: 'Ikon', type: 'string', components: { input: IkonVelger }, hidden: ({ parent }) => !!parent?.logo }),
          ],
          preview: { select: { title: 'tittel', subtitle: 'tekst' } },
        }),
      ],
    }),
    defineField({
      name: 'snarvei',
      title: 'Snarvei under Aktuelt',
      description: 'Vises under siste ABC-nytt, ved siden av den store grønne boksen. Den grønne boksen er en nyhet: rediger den under Nyheter, og velg hvilken med «Fremhev på forsiden».',
      type: 'object',
      fields: [
        defineField({ name: 'merkelapp', title: 'Merkelapp', type: 'string' }),
        defineField({ name: 'tittel', title: 'Tittel', type: 'string' }),
        defineField({ name: 'lenke', title: 'Lenke', type: 'lenke' }),
      ],
    }),
    defineField({
      name: 'dokumentsenter',
      title: 'Dokumentsenter-boks',
      type: 'object',
      fields: [
        defineField({ name: 'tittel', title: 'Tittel', type: 'string' }),
        defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 2 }),
        defineField({ name: 'lenke', title: 'Lenke', type: 'lenke' }),
        defineField({
          name: 'dokumenter',
          title: 'Snarveier',
          description: 'En oppgave fra «Jeg vil …» åpner stegene på Dokumentsenter, og viser oppgavens tittel. Et dokument åpner PDF-en.',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'oppgave' }, { type: 'dokument' }] }],
          validation: (r) => r.max(4),
        }),
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Forside' }) },
});
