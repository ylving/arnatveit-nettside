// Singleton "Om borettslaget": contact details, addresses and facts. Used by the contact section, the facts section,
// the footer, Styret's contact box and every "e-post til styret" on the site. The contact person is the member with
// "Kontaktperson for borettslaget" on under Styre og utvalg (people are kept there only).
import { defineField, defineType } from 'sanity';
import { lucideIkon } from '../../components/LucideIkon';

export const OM_ID = 'omBorettslaget';

export const omBorettslaget = defineType({
  name: 'omBorettslaget',
  title: 'Om borettslaget',
  type: 'document',
  icon: lucideIkon('Building2'),
  groups: [
    { name: 'kontakt', title: 'Kontakt og adresser', default: true },
    { name: 'fakta', title: 'Fakta' },
  ],
  fields: [
    defineField({ name: 'epost', title: 'E-post til styret', type: 'email', group: 'kontakt', validation: (r) => r.required() }),
    defineField({
      name: 'styreNotat',
      title: 'Tekst under e-posten',
      type: 'text',
      rows: 2,
      group: 'kontakt',
      initialValue: 'Saker du ønsker at styret skal behandle, må sendes skriftlig minst én uke før oppsatt styremøte.',
    }),
    defineField({ name: 'besoksadresse', title: 'Besøksadresse', type: 'text', rows: 2, group: 'kontakt' }),
    defineField({ name: 'kartlenke', title: 'Kartlenke', description: 'Lenken «Vis i kart» under besøksadressen.', type: 'url', group: 'kontakt' }),
    defineField({ name: 'postadresse', title: 'Postadresse', type: 'text', rows: 4, group: 'kontakt' }),
    defineField({ name: 'postNotat', title: 'Postadresse – merknad', type: 'string', group: 'kontakt', initialValue: 'Post til styret går via forretningsfører.' }),
    defineField({ name: 'fakturaadresse', title: 'Fakturaadresse', type: 'text', rows: 4, group: 'kontakt' }),
    defineField({ name: 'fakturaNotat', title: 'Fakturaadresse – merknad', type: 'string', group: 'kontakt', initialValue: 'For leverandører.' }),
    defineField({ name: 'fakturaEpost', title: 'E-post for faktura', type: 'email', group: 'kontakt' }),

    defineField({ name: 'juridiskNavn', title: 'Juridisk navn', type: 'string', group: 'fakta' }),
    defineField({
      name: 'orgnr',
      title: 'Organisasjonsnummer',
      description: 'Ni siffer, f.eks. «946 024 627». Lenken til Brønnøysundregistrene lages av seg selv.',
      type: 'string',
      group: 'fakta',
      validation: (r) => r.custom((v?: string) => (!v || /^\d{9}$/.test(v.replace(/\s/g, '')) ? true : 'Organisasjonsnummeret skal ha ni siffer.')),
    }),
    defineField({ name: 'selskapsform', title: 'Selskapsform', type: 'string', group: 'fakta' }),
    defineField({ name: 'forretningsforer', title: 'Forretningsfører', type: 'string', group: 'fakta' }),
    defineField({ name: 'revisor', title: 'Revisor', type: 'string', group: 'fakta' }),
    defineField({ name: 'stiftet', title: 'Stiftet', type: 'date', group: 'fakta' }),
    defineField({ name: 'andeler', title: 'Antall andeler', type: 'number', group: 'fakta', validation: (r) => r.integer().min(1) }),
    defineField({ name: 'tun', title: 'Antall tun', type: 'number', group: 'fakta', validation: (r) => r.integer().min(1) }),
  ],
  preview: { prepare: () => ({ title: 'Om borettslaget' }) },
});
