// Calendar feed of all upcoming events ("Abonner på kalenderen"): /kalender.ics
import type { APIRoute } from 'astro';
import { load } from '../lib/sanity';
import { ARRANGEMENTER, ics, kommende, type Arrangement } from '../lib/arrangement';

export const GET: APIRoute = async ({ site }) => {
  const { navn, liste } = await load<{ navn: string; liste: Arrangement[] }>(`{ "navn": *[_id == "innstillinger"][0].navn, "liste": ${ARRANGEMENTER} }`);
  return ics(kommende(liste), { site: site!, navn, feed: true });
};
