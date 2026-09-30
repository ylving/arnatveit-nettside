import { defineField, defineType } from 'sanity';
import { erIkon } from '../../ikoner';
import { STANDARD_IKON } from '../../standarder';
import { IkonVelger } from '../../components/IkonVelger';
import { sti } from '../../actions/videresending';

// Top-level addresses used by the site's own routes
const RESERVERT = ['aktuelt', 'admin', '404'];

export const side = defineType({
  name: 'side',
  title: 'Side',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'overskrift',
      title: 'Overskrift på siden (valgfri)',
      description: 'Den store overskriften øverst på siden, f.eks. «Vedtekter og regler». La stå tomt for å bruke tittelen. Tittelen brukes i menyen, brødsmulene og på kortene.',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Adresse',
      type: 'slug',
      options: { source: 'tittel' },
      validation: (r) => [
        r.required().custom((slug, { document }) =>
          !document?.forelder && RESERVERT.includes(slug?.current ?? '') ? `«${slug?.current}» er reservert av nettsiden. Velg en annen adresse.` : true,
        ),
        // Another page's old address? Then publishing this page takes it over (the redirect is dropped at build).
        r.custom(async (slug, { document, getClient }) => {
          if (!slug?.current || !document) return true;
          const client = getClient({ apiVersion: '2026-09-01' });
          const id = document._id.replace(/^drafts\./, '');
          const forelderRef = (document.forelder as { _ref?: string } | undefined)?._ref;
          const forelderSlug = forelderRef ? await client.fetch<string | null>('*[_id == $ref][0].slug.current', { ref: forelderRef }) : null;
          const adresse = sti({ slug }, forelderSlug);
          const annen = await client.fetch<string | null>(
            '*[_type == "side" && !(_id in [$id, $draftId]) && !(_id in path("drafts.**")) && count(gamleUrler[@ == $adresse || string::startsWith(@, $adresse + "#")]) > 0][0].tittel',
            { id, draftId: `drafts.${id}`, adresse },
          );
          return annen
            ? `Adressen ${adresse} var tidligere brukt av «${annen}», og videresendes dit i dag. Når denne siden publiseres, viser adressen denne siden i stedet.`
            : true;
        }).warning(),
      ],
    }),
    defineField({
      name: 'forelder',
      title: 'Overordnet side',
      description: 'La stå tomt for en side på toppnivå. Velger du en side her, får denne siden adressen /overordnet-side/denne-siden og vises som et kort på den overordnede siden.',
      type: 'reference',
      to: [{ type: 'side' }],
      options: {
        // Only top-level pages can be parents (one level deep), and never the page itself
        filter: ({ document }) => {
          const id = document._id.replace(/^drafts\./, '');
          return { filter: '!defined(forelder) && !(_id in [$id, $draftId])', params: { id, draftId: `drafts.${id}` } };
        },
      },
      validation: (r) =>
        r.custom(async (forelder, { document, getClient }) => {
          if (!forelder?._ref || !document) return true;
          const id = document._id.replace(/^drafts\./, '');
          const client = getClient({ apiVersion: '2026-09-01' });
          const { barn, forelderHarForelder } = await client.fetch(
            `{ "barn": count(*[_type == "side" && forelder._ref == $id]), "forelderHarForelder": defined(*[_id == $ref][0].forelder) }`,
            { id, ref: forelder._ref },
          );
          if (barn > 0) return 'Denne siden har selv undersider, og kan derfor ikke legges under en annen side.';
          if (forelderHarForelder) return 'Den valgte siden ligger selv under en annen side. Velg en side på toppnivå.';
          return true;
        }),
    }),
    defineField({
      name: 'ikon',
      title: 'Ikon',
      description: 'Vises på kortet på den overordnede siden. Står feltet tomt, brukes standardikonet (dokument).',
      type: 'string',
      initialValue: STANDARD_IKON,
      components: { input: IkonVelger },
      hidden: ({ document }) => !document?.forelder,
      validation: (r) => r.custom((v) => (v && !erIkon(v) ? `Ukjent ikon «${v}». Velg et nytt ikon.` : true)).warning(),
    }),
    defineField({ name: 'rekkefolge', title: 'Rekkefølge', type: 'number', initialValue: 100 }),
    defineField({
      name: 'kort',
      title: 'Korttekst',
      description: 'Kort beskrivelse på kortet på den overordnede siden (én til to linjer).',
      type: 'string',
      hidden: ({ document }) => !document?.forelder,
      validation: (r) =>
        r.custom((v, { document }) => (document?.forelder && !v?.trim() ? 'Denne siden vises som kort uten beskrivelse.' : true)).warning(),
    }),
    defineField({ name: 'ingress', title: 'Ingress', type: 'text', rows: 3 }),
    defineField({
      name: 'kontaktboks',
      title: 'Kontaktboks i toppen',
      description: 'Grønn boks ved siden av tittelen med en e-postadresse som lenke, f.eks. «Skriv til hele styret».',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'tittel', title: 'Tittel', type: 'string', placeholder: 'Skriv til hele styret' }),
        defineField({ name: 'epost', title: 'E-post', description: 'La stå tomt for å bruke styrets e-post fra «Om borettslaget».', type: 'email' }),
      ],
    }),
    defineField({
      name: 'snarveier',
      title: 'Vis snarveier øverst',
      description: 'Knapper under ingressen som hopper til seksjonene «Kontaktinfo», «Tekst i grønt bånd» og «Fakta om borettslaget» på siden.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({ name: 'seksjoner', title: 'Innhold', type: 'seksjoner' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
    defineField({
      name: 'gamleUrler',
      title: 'Gamle adresser',
      description: 'Adresser fra gammel nettside som skal videresendes hit, f.eks. /praktiskinfo/styret',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  orderings: [{ title: 'Rekkefølge', name: 'rekkefolge', by: [{ field: 'rekkefolge', direction: 'asc' }] }],
  preview: {
    select: { title: 'tittel', slug: 'slug.current', forelder: 'forelder.slug.current' },
    prepare: ({ title, slug, forelder }) => ({ title, subtitle: forelder ? `/${forelder}/${slug}` : `/${slug}` }),
  },
});
