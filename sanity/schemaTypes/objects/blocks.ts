import { defineArrayMember, defineField, defineType } from 'sanity';

export const bilde = defineType({
  name: 'bilde',
  title: 'Bilde',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Alternativ tekst', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'bildetekst', title: 'Bildetekst', type: 'string' }),
  ],
});

export const infoboks = defineType({
  name: 'infoboks',
  title: 'Infoboks',
  type: 'object',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string' }),
    defineField({ name: 'tekst', title: 'Tekst', type: 'array', of: [{ type: 'block' }] }),
  ],
  preview: { select: { title: 'tittel' }, prepare: ({ title }) => ({ title: title || 'Infoboks', subtitle: 'Infoboks' }) },
});

export const dokumentliste = defineType({
  name: 'dokumentliste',
  title: 'Dokumentliste',
  type: 'object',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string' }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      type: 'reference',
      to: [{ type: 'dokumentkategori' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'grupperEtterAar', title: 'Grupper etter år', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'tittel', kategori: 'kategori.tittel' },
    prepare: ({ title, kategori }) => ({ title: title || kategori, subtitle: `Dokumentliste · ${kategori ?? ''}` }),
  },
});

export const medlemsliste = defineType({
  name: 'medlemsliste',
  title: 'Medlemsliste',
  type: 'object',
  fields: [
    defineField({ name: 'utvalg', title: 'Utvalg', type: 'reference', to: [{ type: 'utvalg' }], validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'utvalg.navn' }, prepare: ({ title }) => ({ title, subtitle: 'Medlemsliste' }) },
});

export const faktaliste = defineType({
  name: 'faktaliste',
  title: 'Faktaliste',
  type: 'object',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string' }),
    defineField({
      name: 'rader',
      title: 'Rader',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rad',
          fields: [
            defineField({ name: 'etikett', title: 'Etikett', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'verdi', title: 'Verdi', type: 'text', rows: 2, validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'etikett', subtitle: 'verdi' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'tittel' }, prepare: ({ title }) => ({ title: title || 'Faktaliste', subtitle: 'Faktaliste' }) },
});

export const kontaktinfo = defineType({
  name: 'kontaktinfo',
  title: 'Kontaktinfo',
  type: 'object',
  description: 'Viser adresser og e-post fra Innstillinger',
  fields: [defineField({ name: 'visKart', title: 'Vis kartlenke', type: 'boolean', initialValue: true })],
  preview: { prepare: () => ({ title: 'Kontaktinfo (fra Innstillinger)' }) },
});

export const lenkeknapp = defineType({
  name: 'lenkeknapp',
  title: 'Lenkeknapp',
  type: 'object',
  fields: [defineField({ name: 'lenke', title: 'Lenke', type: 'lenke' })],
  preview: { select: { title: 'lenke.tekst' }, prepare: ({ title }) => ({ title, subtitle: 'Knapp' }) },
});

export const innhold = defineType({
  name: 'innhold',
  title: 'Innhold',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Overskrift 2', value: 'h2' },
        { title: 'Overskrift 3', value: 'h3' },
        { title: 'Sitat', value: 'blockquote' },
      ],
      marks: {
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Lenke',
            fields: [
              { name: 'intern', title: 'Intern', type: 'reference', to: [{ type: 'side' }, { type: 'nyhet' }, { type: 'dokument' }] },
              { name: 'href', title: 'Adresse', type: 'url', validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }) },
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'bilde' }),
    defineArrayMember({ type: 'infoboks' }),
    defineArrayMember({ type: 'dokumentliste' }),
    defineArrayMember({ type: 'medlemsliste' }),
    defineArrayMember({ type: 'faktaliste' }),
    defineArrayMember({ type: 'kontaktinfo' }),
    defineArrayMember({ type: 'lenkeknapp' }),
  ],
});
