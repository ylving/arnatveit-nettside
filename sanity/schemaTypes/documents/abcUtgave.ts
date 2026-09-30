// One issue of ABC-nytt: editors upload the PDF and choose month and year; the cover is made from page 1
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { AbcForsideInput } from '../../components/AbcForsideInput';
import { MAANEDER, utgaveNavn } from '../../standarder';

const stor = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const abcUtgave = defineType({
  name: 'abcUtgave',
  title: 'ABC-nytt',
  type: 'document',
  icon: lucideIkon('Newspaper'),
  fields: [
    defineField({
      name: 'maaned',
      title: 'Måned',
      type: 'number',
      options: { list: MAANEDER.map((m, i) => ({ title: stor(m), value: i + 1 })) },
      initialValue: () => new Date().getMonth() + 1,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'aar',
      title: 'År',
      type: 'number',
      initialValue: () => new Date().getFullYear(),
      validation: (r) => r.required().integer().min(1990).max(2100),
    }),
    defineField({ name: 'fil', title: 'PDF', type: 'file', options: { accept: 'application/pdf' }, validation: (r) => r.required() }),
    defineField({
      name: 'forside',
      title: 'Forside',
      description: 'Lages automatisk fra første side i PDF-en. Du kan laste opp et annet bilde hvis du vil.',
      type: 'image',
      components: { input: AbcForsideInput },
      fields: [
        defineField({ name: 'fraFil', type: 'string', hidden: true }),
        defineField({ name: 'autoBilde', type: 'string', hidden: true }),
      ],
    }),
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
  // One issue per month
  validation: (r) =>
    r.custom(async (doc, { getClient }) => {
      if (!doc?.maaned || !doc?.aar) return true;
      const id = doc._id.replace(/^drafts\./, '');
      const finnes = await getClient({ apiVersion: '2026-09-01' }).fetch<number>(
        'count(*[_type == "abcUtgave" && aar == $aar && maaned == $maaned && !(_id in [$id, $utkast])])',
        { aar: doc.aar, maaned: doc.maaned, id, utkast: `drafts.${id}` },
      );
      return finnes ? `Det finnes allerede en utgave for ${utgaveNavn(doc.maaned as number, doc.aar as number).toLowerCase()}.` : true;
    }),
  orderings: [{ title: 'Nyeste først', name: 'nyest', by: [{ field: 'aar', direction: 'desc' }, { field: 'maaned', direction: 'desc' }] }],
  preview: {
    select: { maaned: 'maaned', aar: 'aar', media: 'forside', size: 'fil.asset.size' },
    prepare: ({ maaned, aar, media, size }) => ({
      title: utgaveNavn(maaned, aar) || 'Ny utgave',
      subtitle: size ? `PDF · ${Math.round(size / 1e3)} kB` : 'Mangler PDF',
      media,
    }),
  },
});
