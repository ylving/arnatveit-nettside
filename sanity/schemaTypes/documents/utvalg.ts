import { defineArrayMember, defineField, defineType, type ValidationContext } from 'sanity';
import { IkonVelger } from '../../components/IkonVelger';

type Medlem = { _key: string; navn?: string } & Record<string, unknown>;

/** A member toggle only one person site-wide may have on (Kontaktperson, Ansvarlig for ABC-nytt) */
const bareEn =
  (felt: string, rolle: string) =>
  async (på: unknown, { document, path, getClient }: ValidationContext) => {
    if (!på || !document) return true;
    const egenKey = (path?.[1] as { _key?: string } | undefined)?._key;
    const id = document._id.replace(/^drafts\./, '');
    // Other members toggled in this committee (current edit state) …
    const her = ((document.medlemmer as Medlem[]) ?? []).filter((m) => m[felt] && m._key !== egenKey);
    // … or in other committees (published)
    const andre = await getClient({ apiVersion: '2026-09-01' }).fetch<string[]>(
      `array::compact(*[_type == "utvalg" && !(_id in [$id, $draftId]) && !(_id in path("drafts.**"))].medlemmer[${felt} == true].navn)`,
      { id, draftId: `drafts.${id}` },
    );
    const navn = [...her.map((m) => m.navn), ...(andre ?? []).flat()].filter(Boolean);
    return navn.length ? `Bare én kan være ${rolle}. ${navn.join(', ')} er allerede ${rolle} – slå det av der først.` : true;
  };

export const utvalg = defineType({
  name: 'utvalg',
  title: 'Styre og utvalg',
  type: 'document',
  fields: [
    defineField({ name: 'navn', title: 'Navn', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text', rows: 2 }),
    defineField({
      name: 'medlemmer',
      title: 'Medlemmer',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'medlem',
          fields: [
            defineField({ name: 'navn', title: 'Navn', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'rolle', title: 'Rolle', type: 'string' }),
            defineField({ name: 'tun', title: 'Tun', type: 'string', options: { list: ['A-tunet', 'B-tunet', 'C-tunet', 'Ekstern'] } }),
            defineField({ name: 'telefon', title: 'Telefon', type: 'string' }),
            defineField({ name: 'epost', title: 'E-post', type: 'email' }),
            defineField({
              name: 'ansvar',
              title: 'Ansvarsområder',
              description: 'Vises i seksjonen «Hvem kontakter jeg?» med navn, telefon og e-post. Flytt området til den nye personen når ansvaret skifter.',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'ansvarsomraade',
                  fields: [
                    defineField({ name: 'omraade', title: 'Område', description: 'F.eks. «Byggesaker»', type: 'string', validation: (r) => r.required() }),
                    defineField({ name: 'beskrivelse', title: 'Tekst (valgfri)', description: 'F.eks. «Er du leverandør og ønsker kontakt med borettslaget?»', type: 'string' }),
                    defineField({ name: 'ikon', title: 'Ikon', description: 'Vises på kortet i «Hvem kontakter jeg?»', type: 'string', components: { input: IkonVelger } }),
                  ],
                  preview: { select: { title: 'omraade', subtitle: 'beskrivelse' } },
                }),
              ],
            }),
            defineField({
              name: 'vara',
              title: 'Varamedlem',
              description: 'Varamedlemmer vises i en egen liste under de faste medlemmene.',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'beplanting',
              title: 'Utvidet beplantingsutvalg',
              description: 'Vises med et blad-ikon i medlemslisten.',
              type: 'boolean',
              initialValue: false,
              // Only Miljøutvalget has an extended planting committee
              hidden: ({ document, value }) => !value && document?._id.replace(/^drafts\./, '') !== 'utvalg-miljoutvalget',
            }),
            defineField({
              name: 'kontaktperson',
              title: 'Kontaktperson for borettslaget',
              description: 'Vises som kontaktperson med navn, telefon og e-post der nettsiden viser kontaktinfo. Bare én person kan være kontaktperson.',
              type: 'boolean',
              initialValue: false,
              validation: (r) => r.custom(bareEn('kontaktperson', 'kontaktperson')),
            }),
            defineField({
              name: 'abcRedaktor',
              title: 'Ansvarlig for ABC-nytt',
              description: 'Navnet vises på ABC-nytt-siden («… har ansvaret for ABC-nytt»). Bare én person kan ha ansvaret.',
              type: 'boolean',
              initialValue: false,
              validation: (r) => r.custom(bareEn('abcRedaktor', 'ansvarlig for ABC-nytt')),
            }),
          ],
          preview: {
            select: { title: 'navn', rolle: 'rolle', vara: 'vara', beplanting: 'beplanting', kontaktperson: 'kontaktperson', abcRedaktor: 'abcRedaktor', a0: 'ansvar.0.omraade', a1: 'ansvar.1.omraade' },
            prepare: ({ title, rolle, vara, beplanting, kontaktperson, abcRedaktor, a0, a1 }) => ({
              title,
              subtitle: [rolle, vara && 'Vara', beplanting && 'Beplantingsutvalg', kontaktperson && 'Kontaktperson', abcRedaktor && 'Ansvarlig for ABC-nytt', a0 && `Ansvar: ${[a0, a1].filter(Boolean).join(', ')}`].filter(Boolean).join(' · '),
            }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'navn', medlemmer: 'medlemmer' }, prepare: ({ title, medlemmer }) => ({ title, subtitle: `${medlemmer?.length ?? 0} medlemmer` }) },
});
