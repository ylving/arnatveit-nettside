// Dev only: when a page, news item or event is published in Sanity, clear Astro's cached getStaticPaths()
// results so new/moved addresses work without restarting `astro dev`. (Astro only clears that cache
// for its own content layer, which we don't use — we send the same signal it sends.)
import { createClient } from '@sanity/client';

export default function sanityDevRefresh({ projectId, dataset, apiVersion }) {
  return {
    name: 'sanity-dev-refresh',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        if (!projectId) return;
        const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
        let timer;
        const sub = client
          // visibility "query": the event arrives once the change is visible to queries
          .listen('*[_type in ["side", "nyhet", "arrangement"]]', {}, { includeResult: false, visibility: 'query' })
          .subscribe({
            next: (event) => {
              if (event.type !== 'mutation' || event.documentId.startsWith('drafts.')) return;
              clearTimeout(timer);
              timer = setTimeout(() => {
                for (const name of ['ssr', 'prerender']) server.environments[name]?.hot.send('astro:content-changed', {});
                logger.info('Innhold publisert i Sanity – sidelisten er oppdatert (last siden på nytt)');
              }, 300);
            },
            error: (err) => logger.warn(`Sanity-lytteren stoppet: ${err.message}. Start dev-serveren på nytt ved behov.`),
          });
        server.httpServer?.once('close', () => sub.unsubscribe());
      },
    },
  };
}
