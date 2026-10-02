// Page builder: `side.seksjoner` is a list of sections. Rich text is one section type (`tekst`);
// structural blocks (lists, images, contact info …) are sections of their own.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { breddeFelt, lenkeAnnotasjon } from './blocks';
import { lucideIkon } from '../../components/LucideIkon';
import { IkonVelger } from '../../components/IkonVelger';
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
    defineField({ name: 'visAnnet', title: 'Vis «Gjelder det noe annet?»', description: 'En linje under kortene med styrets e-post fra «Om borettslaget».', type: 'boolean', initialValue: true }),
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
    defineField({ name: 'innspillEpost', title: 'Innspill – e-post', description: 'La stå tomt for å bruke styrets e-post fra «Om borettslaget».', type: 'email' }),
    breddeFelt('abcUtgaver'),
  ],
  preview: { prepare: () => ({ title: 'ABC-nytt-utgaver', subtitle: 'Siste utgave, tidligere utgaver og arkiv' }) },
});

export const fargebaand = defineType({
  name: 'fargebaand',
  title: 'Tekst i grønt bånd',
  type: 'object',
  icon: lucideIkon('PanelTop'),
  description: 'Et grønt bånd over hele bredden med liten overtittel, overskrift og tekst, som «Området» på Om borettslaget.',
  fields: [
    defineField({ name: 'overtittel', title: 'Overtittel', description: 'F.eks. «Området». Brukes også som snarvei øverst på siden.', type: 'string' }),
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'tekst',
      title: 'Tekst',
      type: 'array',
      of: [defineArrayMember({ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [], marks: { annotations: [lenkeAnnotasjon] } })],
    }),
    defineField({
      name: 'kart',
      title: 'Vis kart over området',
      description: 'Et kart over hele bredden nederst i båndet, med borettslaget, Arna stasjon og Øyrane Torg.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: { select: { title: 'tittel', subtitle: 'overtittel', kart: 'kart' }, prepare: ({ title, subtitle, kart }) => ({ title, subtitle: `Grønt bånd${subtitle ? ` · ${subtitle}` : ''}${kart ? ' · med kart' : ''}` }) },
});

export const borettslagsfakta = defineType({
  name: 'borettslagsfakta',
  title: 'Fakta om borettslaget',
  type: 'object',
  icon: lucideIkon('ListChecks'),
  description: 'Tre nøkkeltall (tun, andeler, stiftet) og opplysningene fra «Om borettslaget» (juridisk navn, organisasjonsnummer …).',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', description: 'Brukes også som snarvei øverst på siden.', type: 'string', initialValue: 'Fakta' }),
    defineField({ name: 'ingress', title: 'Tekst ved overskriften', type: 'string', initialValue: 'Offisielle opplysninger om borettslaget, blant annet til bruk ved kjøp og salg.' }),
    breddeFelt('borettslagsfakta'),
  ],
  preview: { select: { tittel: 'tittel' }, prepare: ({ tittel }) => ({ title: tittel || 'Fakta', subtitle: 'Fakta om borettslaget (fra «Om borettslaget»)' }) },
});

export const punkter = defineType({
  name: 'punkter',
  title: 'Punkter med ikon',
  type: 'object',
  icon: lucideIkon('LayoutGrid'),
  description: 'Overskrift til venstre og opptil seks korte punkter med ikon, tittel og tekst til høyre, som «Slik fungerer det» på Generalforsamling.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'punkter',
      title: 'Punkter',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'punkt',
          fields: [
            defineField({ name: 'ikon', title: 'Ikon', type: 'string', components: { input: IkonVelger } }),
            defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tekst', title: 'Tekst', description: 'En eller to setninger.', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'tittel', subtitle: 'tekst' } },
        }),
      ],
      validation: (r) => r.required().min(1).max(6),
    }),
    breddeFelt('punkter'),
  ],
  preview: { select: { title: 'tittel', a: 'punkter.0.tittel', b: 'punkter.1.tittel' }, prepare: ({ title, a, b }) => ({ title, subtitle: `Punkter · ${[a, b].filter(Boolean).join(', ')} …` }) },
});

export const oppfordring = defineType({
  name: 'oppfordring',
  title: 'Oppfordring med knapp',
  type: 'object',
  icon: lucideIkon('PenLine'),
  description: 'En linje over, et lite ikon, overskrift, tekst og en mørk knapp som åpner en e-post, som «Vil du melde inn en sak?».',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 2 }),
    defineField({ name: 'knapp', title: 'Knappetekst', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'epost', title: 'E-post', description: 'La stå tomt for å bruke styrets e-post fra «Om borettslaget».', type: 'email' }),
    defineField({ name: 'emne', title: 'Emne i e-posten (valgfritt)', description: 'F.eks. «Sak til generalforsamlingen»', type: 'string' }),
    breddeFelt('oppfordring'),
  ],
  preview: { select: { title: 'tittel', subtitle: 'knapp' }, prepare: ({ title, subtitle }) => ({ title, subtitle: `Oppfordring · ${subtitle ?? ''}` }) },
});

export const generalforsamlinger = defineType({
  name: 'generalforsamlinger',
  title: 'Generalforsamlinger (protokoller)',
  type: 'object',
  icon: lucideIkon('Gavel'),
  description: 'Siste generalforsamling ved sidetittelen, og alle protokoller som en tidslinje. Generalforsamlingene legges inn under «Generalforsamlinger» i menyen.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Protokoller' }),
    defineField({ name: 'ingress', title: 'Tekst ved overskriften', type: 'string', initialValue: 'Protokoll fra hver generalforsamling, nyeste først' }),
    defineField({
      name: 'neste',
      title: 'Neste generalforsamling',
      description: 'Vises nederst i boksen «Siste generalforsamling», etter «Neste:». F.eks. «Ordinær generalforsamling våren 2027. Innkallingen sendes til alle andelseiere.»',
      type: 'string',
    }),
    breddeFelt('generalforsamlinger'),
  ],
  preview: { select: { title: 'tittel', subtitle: 'neste' }, prepare: ({ title, subtitle }) => ({ title: title || 'Protokoller', subtitle: `Generalforsamlinger${subtitle ? ` · Neste: ${subtitle}` : ''}` }) },
});

export const regelverk = defineType({
  name: 'regelverk',
  title: 'Regelverk (kort)',
  type: 'object',
  icon: lucideIkon('BookOpen'),
  description: 'Store kort for vedtektene og husordensreglene (Les / Last ned) og et kort med lenke til loven, som på Vedtekter.',
  fields: [
    defineField({
      name: 'dokumenter',
      title: 'Dokumenter',
      description: 'Tittel, beskrivelse, PDF og «Sist endret» (datoen) hentes fra dokumentet. Det første kortet blir grønt, det andre oker.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'dokument' }] })],
      validation: (r) => r.max(2).unique(),
    }),
    defineField({ name: 'lovTittel', title: 'Lov – tittel', type: 'string', initialValue: 'Borettslagsloven' }),
    defineField({ name: 'lovBeskrivelse', title: 'Lov – beskrivelse', description: 'Én setning.', type: 'text', rows: 2 }),
    defineField({
      name: 'lovUrl',
      title: 'Lov – lenke',
      description: 'Åpnes i en ny fane. La stå tomt for å skjule kortet.',
      type: 'url',
      initialValue: 'https://lovdata.no/dokument/NL/lov/2003-06-06-39',
    }),
    breddeFelt('regelverk'),
  ],
  preview: {
    select: { a: 'dokumenter.0.tittel', b: 'dokumenter.1.tittel', lov: 'lovTittel', url: 'lovUrl' },
    prepare: ({ a, b, lov, url }) => ({ title: [a, b, url && lov].filter(Boolean).join(' · ') || 'Regelverk', subtitle: 'Regelverk (kort)' }),
  },
});

export const nivaaer = defineType({
  name: 'nivaaer',
  title: 'Figur: nivåer inni hverandre',
  type: 'object',
  icon: lucideIkon('Layers'),
  description: 'Overskrift og tekst til venstre, og til høyre fargede felt som ligger inni hverandre, som «Hvordan henger reglene sammen?».',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tekst', title: 'Tekst', type: 'text', rows: 3 }),
    defineField({
      name: 'nivaaer',
      title: 'Nivåer',
      description: 'Det ytterste først. Hvert nivå ligger inni det forrige. Fargene følger kortene: blå, grønn, oker.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'nivaa',
          fields: [
            defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tekst', title: 'Tekst', description: 'Én linje.', type: 'string' }),
          ],
          preview: { select: { title: 'tittel', subtitle: 'tekst' } },
        }),
      ],
      validation: (r) => r.required().min(2).max(4),
    }),
    breddeFelt('nivaaer'),
  ],
  preview: { select: { title: 'tittel', a: 'nivaaer.0.tittel', b: 'nivaaer.1.tittel' }, prepare: ({ title, a, b }) => ({ title, subtitle: `Nivåer · ${[a, b].filter(Boolean).join(' › ')} …` }) },
});

export const relatert = defineType({
  name: 'relatert',
  title: 'Relatert',
  type: 'object',
  icon: lucideIkon('Link'),
  description: 'Lenkerader til andre sider på nettstedet, med en tynn linje mellom og en pil.',
  fields: [
    defineField({ name: 'tittel', title: 'Overskrift', type: 'string', initialValue: 'Relatert' }),
    defineField({
      name: 'lenker',
      title: 'Lenker',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'relatertLenke',
          fields: [
            defineField({ name: 'side', title: 'Side', type: 'reference', to: [{ type: 'side' }], validation: (r) => r.required() }),
            defineField({ name: 'tittel', title: 'Tekst', description: 'La stå tomt for å bruke sidens tittel, f.eks. «Alle protokoller» i stedet for «Generalforsamling».', type: 'string' }),
            defineField({ name: 'tekst', title: 'Tekst under', description: 'La stå tomt for å bruke kortteksten til siden.', type: 'string' }),
          ],
          preview: { select: { tittel: 'tittel', side: 'side.tittel', subtitle: 'tekst' }, prepare: ({ tittel, side, subtitle }) => ({ title: tittel || side, subtitle }) },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    breddeFelt('relatert'),
  ],
  preview: { select: { tittel: 'tittel', a: 'lenker.0.side.tittel', b: 'lenker.1.side.tittel' }, prepare: ({ tittel, a, b }) => ({ title: tittel || 'Relatert', subtitle: `Relatert · ${[a, b].filter(Boolean).join(', ')}` }) },
});

export const faktaboks = defineType({
  name: 'faktaboks',
  title: 'Faktaboks',
  type: 'object',
  icon: lucideIkon('ClipboardList'),
  description: 'En grønn boks med korte fakta, f.eks. dato og sted for et møte eller en dugnad.',
  fields: [
    defineField({
      name: 'rader',
      title: 'Fakta',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fakta',
          fields: [
            defineField({ name: 'ikon', title: 'Ikon', type: 'string', components: { input: IkonVelger } }),
            defineField({ name: 'etikett', title: 'Etikett', description: 'F.eks. «Dato» eller «Sted»', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'verdi', title: 'Verdi', description: 'F.eks. «Torsdag 28. mai 2026»', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'verdi', subtitle: 'etikett' } },
        }),
      ],
      validation: (r) => r.required().min(1).max(6),
    }),
  ],
  preview: { select: { a: 'rader.0.verdi', b: 'rader.1.verdi' }, prepare: ({ a, b }) => ({ title: [a, b].filter(Boolean).join(' · ') || 'Faktaboks', subtitle: 'Faktaboks' }) },
});

// Insert menu: everyday sections first; "Faste moduler" show data that exists once (ABC-nytt, protocols, contact
// details …) and belong on one page each.
const GRUPPER = [
  { name: 'tekst', title: 'Tekst og bilder', of: ['tekst', 'bilde', 'fargebaand', 'punkter', 'nokkeltall', 'nivaaer'] },
  { name: 'lister', title: 'Lister', of: ['dokumentliste', 'medlemsliste', 'arrangementer'] },
  { name: 'lenker', title: 'Lenker og knapper', of: ['oppfordring', 'relatert', 'undersider'] },
  { name: 'moduler', title: 'Faste moduler', of: ['kontaktinfo', 'borettslagsfakta', 'ansvarsliste', 'oppgaver', 'regelverk', 'generalforsamlinger', 'abcUtgaver'] },
];

export const seksjoner = defineType({
  name: 'seksjoner',
  title: 'Innhold',
  type: 'array',
  of: GRUPPER.flatMap((g) => g.of).map((type) => defineArrayMember({ type })),
  options: { insertMenu: { showIcons: true, views: [{ name: 'list' }], groups: GRUPPER } },
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
