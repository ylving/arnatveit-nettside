// Nightly rebuild of the static site, so past events drop off "Hva skjer" and the calendar feed.
// Calls the Cloudflare Workers Builds deploy hook (secret DEPLOY_HOOK_URL). Deploy: see README.
export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(bygg(env));
  },
};

async function bygg(env) {
  if (!env.DEPLOY_HOOK_URL) throw new Error('DEPLOY_HOOK_URL is not set');
  const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
  if (!res.ok) throw new Error(`Deploy hook answered ${res.status}: ${await res.text()}`);
}
