// When the live site was built. The Studio's "Oppdater nettsiden" button reads it to list published
// changes that aren't on the site yet, and to see when a requested build is out.
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => Response.json({ tid: __BYGG_TID__ });
