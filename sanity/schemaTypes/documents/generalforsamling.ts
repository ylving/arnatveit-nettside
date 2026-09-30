// One general assembly (ordinary or extraordinary) with its protocol. Shown on Generalforsamling (newest in the
// page head, all in the "Protokoller" timeline); the banner can link to the newest protocol automatically.
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { GF_TYPER, gfNavn } from '../../standarder';

export const generalforsamling = defineType({
  name: 'generalforsamling',
  title: 'Generalforsamling',
  type: 'document',
  icon: lucideIkon('Gavel'),
  fields: [
    defineField({ name: 'dato', title: 'Dato', description: 'Vet du bare året, velger du 1. januar.', type: 'date', validation: (r) => r.required() }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: { list: GF_TYPER.map((t) => ({ title: t.navn, value: t.verdi })), layout: 'radio', direction: 'horizontal' },
      initialValue: 'ordinaer',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'sted', title: 'Sted', description: 'F.eks. «Arna Misjonsmenighet»', type: 'string' }),
    defineField({ name: 'protokoll', title: 'Protokoll (PDF)', type: 'file', options: { accept: 'application/pdf' }, validation: (r) => r.required() }),
    defineField({ name: 'innkalling', title: 'Innkalling (PDF, valgfri)', type: 'file', options: { accept: 'application/pdf' } }),
    defineField({
      name: 'gamleUrler',
      title: 'Gamle adresser',
      description: 'Filsti på gammel nettside',
      type: 'array',
      of: [{ type: 'string' }],
      readOnly: true,
      hidden: ({ value }) => !value?.length,
    }),
  ],
  orderings: [{ title: 'Nyeste først', name: 'nyest', by: [{ field: 'dato', direction: 'desc' }] }],
  preview: {
    select: { dato: 'dato', type: 'type', sted: 'sted' },
    prepare: ({ dato, type, sted }) => ({ title: gfNavn(type, dato), subtitle: [dato, sted].filter(Boolean).join(' · ') }),
  },
});
