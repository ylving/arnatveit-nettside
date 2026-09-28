// One .ics file per upcoming event ("Legg i kalender"): /kalender/2026-10-10-hostdugnad.ics
import type { APIRoute, GetStaticPaths } from 'astro';
import { load } from '../../lib/sanity';
import { ARRANGEMENTER, filnavnFor, ics, kommende, type Arrangement } from '../../lib/arrangement';

export const getStaticPaths: GetStaticPaths = async () => {
  const { navn, liste } = await load<{ navn: string; liste: Arrangement[] }>(`{ "navn": *[_id == "innstillinger"][0].navn, "liste": ${ARRANGEMENTER} }`);
  const kom = kommende(liste);
  const filer = filnavnFor(kom);
  return kom.map((a) => ({ params: { fil: filer.get(a._id)! }, props: { a, navn } }));
};

export const GET: APIRoute = ({ props, site }) => ics([props.a], { site: site!, navn: props.navn });
