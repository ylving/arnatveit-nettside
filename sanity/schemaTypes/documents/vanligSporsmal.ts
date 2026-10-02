// A frequently asked question (the «Vanlige spørsmål» section): question, a short answer and one link.
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';

export const vanligSporsmal = defineType({
  name: 'vanligSporsmal',
  title: 'Vanlig spørsmål',
  type: 'document',
  icon: lucideIkon('MessageCircleQuestion'),
  fields: [
    defineField({ name: 'sporsmal', title: 'Spørsmål', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'svar', title: 'Svar', description: 'Kort, et par setninger. Telefonnumre holdes samlet på én linje.', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'lenke', title: 'Lenke', description: 'Én lenke under svaret, f.eks. «Søknad om dyrehold». Kan gå til en side, et dokument eller en oppgave fra «Jeg vil …».', type: 'lenke' }),
  ],
  preview: { select: { title: 'sporsmal', subtitle: 'svar' } },
});
