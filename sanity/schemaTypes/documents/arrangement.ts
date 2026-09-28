// Events (dugnad, social). Shown in the "Hva skjer" page section and in the calendar feed.
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';
import { KATEGORIER } from '../../standarder';

// "14:00" or "14.00"
const KLOKKESLETT = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;
const minutter = (t: string) => { const m = KLOKKESLETT.exec(t.trim()); return m ? +m[1] * 60 + +m[2] : NaN; };
const osloKlokke = (iso: string) => { const [h, m] = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)).split(':'); return +h * 60 + +m; };
const tidFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const arrangement = defineType({
  name: 'arrangement',
  title: 'Arrangement',
  type: 'document',
  icon: lucideIkon('CalendarDays'),
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', description: 'F.eks. «Høstdugnad»', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'kategori',
      title: 'Type',
      type: 'string',
      options: { list: KATEGORIER.map((k) => ({ title: k.navn, value: k.verdi })), layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'start',
      title: 'Dato og starttid',
      type: 'datetime',
      options: { dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', timeStep: 15, displayTimeZone: 'Europe/Oslo' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slutt',
      title: 'Sluttid (valgfri)',
      description: 'Klokkeslett samme dag, f.eks. «14:00».',
      type: 'string',
      validation: (r) =>
        r.custom((v: string | undefined, { document }) => {
          if (!v) return true;
          const slutt = minutter(v);
          if (Number.isNaN(slutt)) return 'Skriv klokkeslettet som «14:00».';
          const start = document?.start as string | undefined;
          return start && slutt <= osloKlokke(start) ? 'Sluttiden må være etter starttiden.' : true;
        }),
    }),
    defineField({ name: 'sted', title: 'Sted', description: 'F.eks. «Alle tun, oppmøte ved ballplassen»', type: 'string' }),
    defineField({
      name: 'tun',
      title: 'Tun (valgfritt)',
      description: 'Velg et tun hvis arrangementet gjelder bare ett tun.',
      type: 'string',
      options: { list: ['A-tunet', 'B-tunet', 'C-tunet'] },
    }),
    defineField({
      name: 'beskrivelse',
      title: 'Kort beskrivelse',
      description: 'Én eller to setninger, f.eks. hva du bør ta med.',
      type: 'text',
      rows: 3,
      validation: (r) => r.max(300).warning('Hold beskrivelsen kort (under 300 tegn).'),
    }),
  ],
  orderings: [
    { title: 'Dato, nyeste først', name: 'startDesc', by: [{ field: 'start', direction: 'desc' }] },
    { title: 'Dato, eldste først', name: 'startAsc', by: [{ field: 'start', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'tittel', start: 'start', slutt: 'slutt', kategori: 'kategori' },
    prepare: ({ title, start, slutt, kategori }) => {
      const k = KATEGORIER.find((x) => x.verdi === kategori);
      const når = start ? `${tidFmt.format(new Date(start))}${slutt ? `–${slutt.replace('.', ':')}` : ''}` : 'Mangler dato';
      return { title, subtitle: [når, k?.navn].filter(Boolean).join(' · '), media: lucideIkon(k?.ikon ?? 'CalendarDays') };
    },
  },
});
