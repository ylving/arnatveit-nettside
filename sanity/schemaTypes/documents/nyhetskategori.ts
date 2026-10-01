// A news category (Generalforsamling, Dugnad …): the tinted pill on news items, and the tint and icon of the drawing
// used when a news item has no image. Editors can add more.
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { IkonVelger } from '../../components/IkonVelger';
import { FARGER } from '../../standarder';

export const nyhetskategori = defineType({
  name: 'nyhetskategori',
  title: 'Nyhetskategori',
  type: 'document',
  icon: lucideIkon('Tag'),
  fields: [
    defineField({
      name: 'tittel',
      title: 'Navn',
      type: 'string',
      validation: (r) =>
        r.required().custom(async (tittel, { document, getClient }) => {
          if (!tittel || !document) return true;
          const id = document._id.replace(/^drafts\./, '');
          const finnes = await getClient({ apiVersion: '2026-09-01' }).fetch<number>(
            'count(*[_type == "nyhetskategori" && lower(tittel) == lower($tittel) && !(_id in [$id, "drafts." + $id])])',
            { tittel, id },
          );
          return finnes ? 'Det finnes allerede en kategori med dette navnet.' : true;
        }),
    }),
    defineField({
      name: 'farge',
      title: 'Farge',
      description: 'Merket og tegningen for saker uten bilde får denne fargen.',
      type: 'string',
      options: { list: FARGER.map((f) => ({ title: f.navn.replace(/ \(.*\)$/, ''), value: f.verdi })), layout: 'radio', direction: 'horizontal' },
      initialValue: 'sand',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'ikon', title: 'Ikon', description: 'Vises i tegningen for saker uten bilde.', type: 'string', components: { input: IkonVelger } }),
  ],
  orderings: [{ title: 'Navn', name: 'tittel', by: [{ field: 'tittel', direction: 'asc' }] }],
  preview: { select: { title: 'tittel', farge: 'farge' }, prepare: ({ title, farge }) => ({ title, subtitle: FARGER.find((f) => f.verdi === farge)?.navn.replace(/ \(.*\)$/, '') }) },
});
