// "Jeg vil …" tasks in Dokumentsenteret: a card that opens a step-by-step guide with the documents to use
import { defineArrayMember, defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { OPPGAVE_IKONER } from '../../standarder';

export const oppgave = defineType({
  name: 'oppgave',
  title: 'Oppgave',
  type: 'document',
  icon: lucideIkon('ListChecks'),
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', description: 'Fortsetter «Jeg vil …», f.eks. «Bygge ark eller tilbygg»', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'ikon',
      title: 'Ikon',
      type: 'string',
      options: { list: OPPGAVE_IKONER.map((i) => ({ title: i.navn, value: i.verdi })), layout: 'radio', direction: 'horizontal' },
      initialValue: 'FileText',
    }),
    defineField({
      name: 'aksent',
      title: 'Farge',
      type: 'string',
      options: { list: [{ title: 'Grønn', value: 'gronn' }, { title: 'Oker', value: 'oker' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'oker',
    }),
    defineField({
      name: 'steg',
      title: 'Steg',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'oppgavesteg',
          fields: [
            defineField({ name: 'tekst', title: 'Tekst', description: 'F.eks. «Fyll ut søknaden»', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'dokumenter',
              title: 'Dokumenter (valgfritt)',
              description: 'Vises under teksten. Hele boksen åpner dokumentet, og det er en knapp for å laste det ned.',
              type: 'array',
              of: [defineArrayMember({ type: 'reference', to: [{ type: 'dokument' }] })],
              validation: (r) => r.unique(),
            }),
          ],
          preview: {
            select: { title: 'tekst', d0: 'dokumenter.0.tittel', d1: 'dokumenter.1.tittel', antall: 'dokumenter' },
            prepare: ({ title, d0, d1, antall }) => ({ title, subtitle: [d0, d1].filter(Boolean).join(', ') + ((antall?.length ?? 0) > 2 ? ' …' : '') }),
          },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: 'kontakttekst', title: 'Spørsmål? – tekst', description: 'F.eks. «Send søknaden til styret.»', type: 'string' }),
    defineField({ name: 'kontaktEpost', title: 'Spørsmål? – e-post', description: 'La stå tomt for å bruke styrets e-post fra «Om borettslaget».', type: 'email' }),
  ],
  preview: {
    select: { title: 'tittel', steg: 'steg' },
    prepare: ({ title, steg }) => ({ title, subtitle: `${steg?.length ?? 0} steg` }),
  },
});
