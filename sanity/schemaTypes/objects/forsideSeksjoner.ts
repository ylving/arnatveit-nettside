// Front page builder: `forside.seksjoner` is a list of the front page's own modules, each at most once, in any order.
// The hero (title, buttons, image, train card) stays fixed above them.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { IkonVelger } from '../../components/IkonVelger';
import { NAA_STYRET } from '../../standarder';

export const forsideFakta = defineType({
  name: 'forsideFakta',
  title: 'Å bo her (faktakort)',
  type: 'object',
  icon: lucideIkon('House'),
  description: 'Det grønne båndet med tekst til venstre og opptil fire faktakort til høyre.',
  fields: [
    defineField({ name: 'overtittel', title: 'Overtittel', type: 'string', placeholder: 'Å bo her' }),
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', placeholder: 'Tre tun, ett nabolag' }),
    defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 3 }),
    defineField({
      name: 'fakta',
      title: 'Faktakort',
      type: 'array',
      validation: (r) => r.required().min(1).max(4),
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
  ],
  preview: { select: { title: 'tittel', subtitle: 'overtittel' }, prepare: ({ title, subtitle }) => ({ title: title || 'Å bo her', subtitle: `Grønt bånd med faktakort${subtitle ? ` · ${subtitle}` : ''}` }) },
});

export const forsideAktuelt = defineType({
  name: 'forsideAktuelt',
  title: 'Aktuelt',
  type: 'object',
  icon: lucideIkon('Newspaper'),
  description: 'Den nyeste nyheten stort (eller den som er festet øverst), og de tre neste ved siden av. Lages av seg selv fra Nyheter.',
  fields: [defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Aktuelt' })],
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'Aktuelt', subtitle: 'De nyeste nyhetene' }) },
});

export const forsideNaa = defineType({
  name: 'forsideNaa',
  title: 'I borettslaget nå',
  type: 'object',
  icon: lucideIkon('CalendarDays'),
  description: 'Sandfarget bånd med neste arrangement (fra Arrangementer), siste ABC-nytt og «Skriv til styret». Arrangement og ABC-nytt lages av seg selv.',
  fields: [
    defineField({ name: 'tittel', title: 'Navn', description: 'Vises ikke, men leses opp av skjermlesere.', type: 'string', initialValue: 'I borettslaget nå' }),
    defineField({
      name: 'styret',
      title: 'Skriv til styret',
      description: 'Den tredje kolonnen. E-posten er styrets adresse fra «Om borettslaget», og lenken går til Styret. La feltene stå tomme for å bruke teksten som står der nå.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'overtittel', title: 'Overtittel', type: 'string', placeholder: NAA_STYRET.overtittel }),
        defineField({ name: 'tittel', title: 'Overskrift', type: 'string', placeholder: NAA_STYRET.tittel }),
        defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 2, placeholder: NAA_STYRET.tekst }),
      ],
    }),
  ],
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'I borettslaget nå', subtitle: 'Neste arrangement, siste ABC-nytt og «Skriv til styret»' }) },
});

export const forsidePraktisk = defineType({
  name: 'forsidePraktisk',
  title: 'Praktisk info',
  type: 'object',
  icon: lucideIkon('LayoutGrid'),
  description: 'Kort for sidene under Praktisk info, i samme rekkefølge som der.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', description: 'Lenker til Praktisk info-siden.', type: 'string', initialValue: 'Praktisk info' }),
    defineField({ name: 'ingress', title: 'Tekst ved overskriften', description: 'La stå tomt for å bruke ingressen til Praktisk info-siden.', type: 'string' }),
  ],
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'Praktisk info', subtitle: 'Kort for sidene under Praktisk info' }) },
});

export const forsideDokumentsenter = defineType({
  name: 'forsideDokumentsenter',
  title: 'Dokumentsenter-boks',
  type: 'object',
  icon: lucideIkon('FileText'),
  description: 'Sandfarget boks med tekst og knapp til venstre og opptil fire snarveier til høyre.',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
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
  preview: { select: { title: 'tittel' }, prepare: ({ title }) => ({ title: title || 'Dokumentsenter-boks', subtitle: 'Dokumentsenter-boks' }) },
});

const TYPER = ['forsideFakta', 'forsideAktuelt', 'forsideNaa', 'forsidePraktisk', 'forsideDokumentsenter'];

export const forsideSeksjoner = defineType({
  name: 'forsideSeksjoner',
  title: 'Seksjoner',
  type: 'array',
  of: TYPER.map((type) => defineArrayMember({ type })),
  options: { insertMenu: { showIcons: true, views: [{ name: 'list' }] } },
  // Each module once: they show the same data, so a second copy would only repeat it
  validation: (r) =>
    r.custom((liste: { _type: string; _key: string }[] | undefined) => {
      const feil = (liste ?? []).flatMap((s, i, a) =>
        a.findIndex((t) => t._type === s._type) < i ? [{ message: 'Denne seksjonen står allerede på forsiden.', path: [{ _key: s._key }] }] : [],
      );
      return feil.length ? feil : true;
    }),
});
