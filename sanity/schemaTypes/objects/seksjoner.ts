// Page builder: `side.seksjoner` is a list of sections. Rich text is one section type (`tekst`);
// structural blocks (lists, images, contact info …) are sections of their own.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { breddeFelt, lenkeAnnotasjon } from './blocks';
import { lucideIkon } from '../../components/LucideIkon';
import { KATEGORIER } from '../../standarder';

type Blokk = { _type: string; children?: { text?: string }[] };
const blokkTekst = (blokker: Blokk[] = []) =>
  blokker.filter((b) => b._type === 'block').map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ').trim();

export const tekst = defineType({
  name: 'tekst',
  title: 'Tekst',
  type: 'object',
  icon: lucideIkon('Type'),
  fields: [
    defineField({
      name: 'innhold',
      title: 'Tekst',
      type: 'array',
      // Text only: images, lists and boxes are sections of their own
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Overskrift 2', value: 'h2' },
            { title: 'Overskrift 3', value: 'h3' },
            { title: 'Sitat', value: 'blockquote' },
          ],
          marks: { annotations: [lenkeAnnotasjon] },
        }),
      ],
    }),
  ],
  validation: (r) => r.custom((v: { innhold?: Blokk[] } | undefined) => (blokkTekst(v?.innhold) ? true : 'Tom tekstseksjon.')).warning(),
  preview: {
    select: { innhold: 'innhold' },
    prepare: ({ innhold }) => {
      const t = blokkTekst(innhold);
      return { title: t ? (t.length > 80 ? `${t.slice(0, 80)}…` : t) : 'Tom tekstseksjon', subtitle: 'Tekst' };
    },
  },
});

export const knapper = defineType({
  name: 'knapper',
  title: 'Knapper',
  type: 'object',
  icon: lucideIkon('MousePointerClick'),
  fields: [
    defineField({ name: 'lenker', title: 'Knapper', type: 'array', of: [{ type: 'lenke' }], validation: (r) => r.required().min(1).max(2) }),
    breddeFelt('knapper'),
  ],
  preview: {
    select: { a: 'lenker.0.tekst', b: 'lenker.1.tekst' },
    prepare: ({ a, b }) => ({ title: [a, b].filter(Boolean).join(' · ') || 'Knapper', subtitle: 'Knapper' }),
  },
});

export const undersider = defineType({
  name: 'undersider',
  title: 'Undersider',
  type: 'object',
  icon: lucideIkon('LayoutGrid'),
  description: 'Viser sidene som ligger under denne siden som kort, her i innholdet.',
  fields: [defineField({ name: 'tittel', title: 'Overskrift (valgfri)', type: 'string' }), breddeFelt('undersider')],
  validation: (r) =>
    r.custom(async (_v, { document, getClient }) => {
      if (!document) return true;
      const id = document._id.replace(/^drafts\./, '');
      const antall = await getClient({ apiVersion: '2026-09-01' }).fetch<number>('count(*[_type == "side" && forelder._ref == $id])', { id });
      return antall > 0 ? true : 'Denne siden har ingen undersider ennå, så seksjonen vises ikke.';
    }).warning(),
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'Undersider', subtitle: 'Kort for sidene under denne' }) },
});

export const ansvarsliste = defineType({
  name: 'ansvarsliste',
  title: 'Hvem kontakter jeg?',
  type: 'object',
  icon: lucideIkon('Contact'),
  description: 'Viser ansvarsområdene fra Styre og utvalg, med navn, telefon og e-post til den ansvarlige.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Hvem kontakter jeg?' }),
    defineField({ name: 'utvalg', title: 'Bare fra', description: 'La stå tomt for å vise ansvarsområder fra alle utvalg.', type: 'reference', to: [{ type: 'utvalg' }] }),
    defineField({ name: 'visAnnet', title: 'Vis «Gjelder det noe annet?»', description: 'En linje under kortene med styrets e-post fra Innstillinger.', type: 'boolean', initialValue: true }),
    breddeFelt('ansvarsliste'),
  ],
  validation: (r) =>
    r.custom(async (_v, { getClient }) => {
      const antall = await getClient({ apiVersion: '2026-09-01' }).fetch<number>(
        'count(array::compact(*[_type == "utvalg" && !(_id in path("drafts.**"))].medlemmer[count(ansvar) > 0]))',
      );
      return antall > 0 ? true : 'Ingen i Styre og utvalg har ansvarsområder ennå, så seksjonen vises tom.';
    }).warning(),
  preview: {
    select: { tittel: 'tittel', utvalg: 'utvalg.navn' },
    prepare: ({ tittel, utvalg }) => ({ title: tittel || 'Hvem kontakter jeg?', subtitle: `Ansvarsområder · ${utvalg ?? 'alle utvalg'}` }),
  },
});

export const arrangementer = defineType({
  name: 'arrangementer',
  title: 'Hva skjer',
  type: 'object',
  icon: lucideIkon('CalendarDays'),
  description: 'Kommende arrangementer fra «Arrangementer», med valg mellom dugnad, sosialt og alle. Tidligere arrangementer forsvinner av seg selv.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Hva skjer' }),
    defineField({
      name: 'kategori',
      title: 'Vis først',
      description: 'Denne typen står først og er valgt når siden åpnes.',
      type: 'string',
      options: { list: KATEGORIER.map((k) => ({ title: k.navn, value: k.verdi })), layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required(),
    }),
    breddeFelt('arrangementer'),
  ],
  preview: {
    select: { tittel: 'tittel', kategori: 'kategori' },
    prepare: ({ tittel, kategori }) => ({
      title: tittel || 'Hva skjer',
      subtitle: `Arrangementer · ${KATEGORIER.find((k) => k.verdi === kategori)?.navn ?? 'velg type'} først`,
    }),
  },
});

export const oppgaver = defineType({
  name: 'oppgaver',
  title: 'Jeg vil …',
  type: 'object',
  icon: lucideIkon('ListChecks'),
  description: 'Kort for oppgaver som «Bygge ark eller tilbygg». Hvert kort åpner en steg-for-steg-veiledning med dokumentene som trengs.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Jeg vil …' }),
    defineField({ name: 'ingress', title: 'Tekst ved overskriften', type: 'string', initialValue: 'Velg en oppgave for å se steg for steg hva du må gjøre.' }),
    defineField({
      name: 'oppgaver',
      title: 'Oppgaver',
      description: 'Dra for å endre rekkefølgen. Oppgavene lages under Dokumenter → Oppgaver.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'oppgave' }] })],
      validation: (r) => r.required().min(1).unique(),
    }),
    breddeFelt('oppgaver'),
  ],
  preview: {
    select: { tittel: 'tittel', a: 'oppgaver.0.tittel', b: 'oppgaver.1.tittel' },
    prepare: ({ tittel, a, b }) => ({ title: tittel || 'Jeg vil …', subtitle: `Oppgaver · ${[a, b].filter(Boolean).join(', ')}…` }),
  },
});

export const dokumentsok = defineType({
  name: 'dokumentsok',
  title: 'Alle dokumenter (med søk)',
  type: 'object',
  icon: lucideIkon('FileSearch'),
  description: 'Dokumentene i de valgte kategoriene, gruppert etter kategori, med søkefelt og filter.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Alle dokumenter' }),
    defineField({
      name: 'kategorier',
      title: 'Kategorier',
      description: 'Dra for å endre rekkefølgen. Teksten under hver gruppe og fargen settes på kategorien.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'dokumentkategori' }] })],
      validation: (r) => r.required().min(1).unique(),
    }),
    breddeFelt('dokumentsok'),
  ],
  preview: {
    select: { tittel: 'tittel', a: 'kategorier.0.tittel', b: 'kategorier.1.tittel', c: 'kategorier.2.tittel' },
    prepare: ({ tittel, a, b, c }) => ({ title: tittel || 'Alle dokumenter', subtitle: `Dokumenter · ${[a, b, c].filter(Boolean).join(', ')}` }),
  },
});

export const abcUtgaver = defineType({
  name: 'abcUtgaver',
  title: 'ABC-nytt-utgaver',
  type: 'object',
  icon: lucideIkon('Newspaper'),
  description: 'Siste utgave (ved sidetittelen), tidligere utgaver, arkiv etter år og «Har du noe til neste nummer?». Utgavene lastes opp under ABC-nytt.',
  fields: [
    defineField({ name: 'innspillTittel', title: 'Innspill – overskrift', type: 'string', initialValue: 'Har du noe til neste nummer?' }),
    defineField({
      name: 'innspillTekst',
      title: 'Innspill – tekst',
      description: 'Navnet på den som har ansvaret legges til etter teksten. Det settes under Styre og utvalg («Ansvarlig for ABC-nytt»).',
      type: 'string',
      initialValue: 'Tips, bilder og beskjeder til naboene er velkomne.',
    }),
    defineField({ name: 'innspillEpost', title: 'Innspill – e-post', description: 'La stå tomt for å bruke styrets e-post fra Innstillinger.', type: 'email' }),
    breddeFelt('abcUtgaver'),
  ],
  preview: { prepare: () => ({ title: 'ABC-nytt-utgaver', subtitle: 'Siste utgave, tidligere utgaver og arkiv' }) },
});

export const seksjoner = defineType({
  name: 'seksjoner',
  title: 'Innhold',
  type: 'array',
  of: [
    defineArrayMember({ type: 'tekst' }),
    defineArrayMember({ type: 'bilde' }),
    defineArrayMember({ type: 'infoboks' }),
    defineArrayMember({ type: 'dokumentliste' }),
    defineArrayMember({ type: 'dokumentsok' }),
    defineArrayMember({ type: 'oppgaver' }),
    defineArrayMember({ type: 'abcUtgaver' }),
    defineArrayMember({ type: 'medlemsliste' }),
    defineArrayMember({ type: 'faktaliste' }),
    defineArrayMember({ type: 'nokkeltall' }),
    defineArrayMember({ type: 'arrangementer' }),
    defineArrayMember({ type: 'kontaktinfo' }),
    defineArrayMember({ type: 'ansvarsliste' }),
    defineArrayMember({ type: 'knapper' }),
    defineArrayMember({ type: 'undersider' }),
  ],
  options: {
    insertMenu: {
      showIcons: true,
      views: [{ name: 'list' }],
      groups: [
        { name: 'tekst', title: 'Tekst og bilder', of: ['tekst', 'bilde', 'infoboks'] },
        { name: 'lister', title: 'Lister', of: ['dokumentliste', 'dokumentsok', 'oppgaver', 'abcUtgaver', 'medlemsliste', 'faktaliste', 'nokkeltall', 'arrangementer'] },
        { name: 'annet', title: 'Kontakt og navigasjon', of: ['kontaktinfo', 'ansvarsliste', 'knapper', 'undersider'] },
      ],
    },
  },
  validation: (r) =>
    r.custom((liste: { _type: string; _key: string }[] | undefined) => {
      const feil = (liste ?? []).flatMap((s, i, a) =>
        i > 0 && s._type === 'tekst' && a[i - 1]._type === 'tekst'
          ? [{ message: 'To tekstseksjoner etter hverandre – de kan slås sammen til én.', path: [{ _key: s._key }] }]
          : [],
      );
      return feil.length ? feil : true;
    }).warning(),
});
