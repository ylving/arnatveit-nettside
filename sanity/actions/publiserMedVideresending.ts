// Wraps the built-in Publish action for pages: if the page's address changed since it was last
// published (new slug or parent), the live address is added to `gamleUrler` in the same publish,
// so the next build redirects it (see src/pages/[redirects].ts).
import { useClient, useDocumentOperation, type DocumentActionComponent } from 'sanity';
import { nyeGamleUrler, sti, type SideUtkast } from './videresending';

const cache = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

export function medVideresending(original: DocumentActionComponent): DocumentActionComponent {
  const cached = cache.get(original);
  if (cached) return cached;

  const Publiser: DocumentActionComponent = (props) => {
    const resultat = original(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    const client = useClient({ apiVersion: '2026-09-01' });
    if (!resultat) return resultat;

    return {
      ...resultat,
      onHandle: async () => {
        try {
          const publisert = props.published as SideUtkast;
          const utkast = props.draft as SideUtkast;
          if (publisert && utkast) {
            // Parent slugs as currently published (= what the live site serves)
            const forelder = await client.fetch<{ liv: string | null; ny: string | null }>(
              `{ "liv": *[_id == $liv][0].slug.current, "ny": *[_id == $ny][0].slug.current }`,
              { liv: publisert.forelder?._ref ?? '', ny: utkast.forelder?._ref ?? '' },
            );
            const liste = nyeGamleUrler(sti(publisert, forelder.liv), sti(utkast, forelder.ny), utkast.gamleUrler);
            if (liste) patch.execute([{ set: { gamleUrler: liste } }]);
          }
        } catch (e) {
          console.error('[videresending] Kunne ikke registrere gammel adresse:', e); // never block publishing
        }
        resultat.onHandle?.();
      },
    };
  };
  Publiser.action = original.action;
  cache.set(original, Publiser);
  return Publiser;
}
