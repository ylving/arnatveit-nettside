import { defineField, defineType } from 'sanity';
import { IkonVelger } from '../../components/IkonVelger';
import { FARGER, STANDARD_FARGE } from '../../standarder';

export const dokumentkategori = defineType({
  name: 'dokumentkategori',
  title: 'Dokumentkategori',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Nøkkel', type: 'slug', options: { source: 'tittel' }, validation: (r) => r.required() }),
    defineField({
      name: 'ingress',
      title: 'Tekst under overskriften',
      description: 'Én linje i Dokumentsenteret, f.eks. «Dette må styret godkjenne før du setter i gang.»',
      type: 'string',
    }),
    defineField({
      name: 'farge',
      title: 'Farge',
      description: 'Fargen på ikonet ved hvert dokument i kategorien.',
      type: 'string',
      options: { list: FARGER.map((f) => ({ title: f.navn, value: f.verdi })), layout: 'radio' },
      initialValue: STANDARD_FARGE,
    }),
    defineField({ name: 'ikon', title: 'Ikon', description: 'Vises ved hvert dokument i kategorien.', type: 'string', components: { input: IkonVelger } }),
    defineField({
      name: 'sortering',
      title: 'Sortering',
      type: 'string',
      options: {
        list: [
          { title: 'Nyeste først', value: 'dato' },
          { title: 'Alfabetisk', value: 'tittel' },
          { title: 'Egen rekkefølge (feltet «Rekkefølge» på dokumentene)', value: 'rekkefolge' },
        ],
        layout: 'radio',
      },
      initialValue: 'dato',
    }),
  ],
  preview: { select: { title: 'tittel', subtitle: 'ingress' } },
});
