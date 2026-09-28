import { lenke } from './objects/lenke';
import { seo } from './objects/seo';
import { bilde, dokumentliste, faktaliste, infoboks, innhold, kontaktinfo, lenkeknapp, medlemsliste, nokkeltall } from './objects/blocks';
import { ansvarsliste, arrangementer, knapper, seksjoner, tekst, undersider } from './objects/seksjoner';
import { innstillinger } from './documents/innstillinger';
import { forside } from './documents/forside';
import { side } from './documents/side';
import { nyhet } from './documents/nyhet';
import { dokument } from './documents/dokument';
import { dokumentkategori } from './documents/dokumentkategori';
import { utvalg } from './documents/utvalg';
import { arrangement } from './documents/arrangement';
import { nettsidebygg } from './documents/nettsidebygg';

export const schemaTypes = [
  lenke, seo, bilde, infoboks, dokumentliste, medlemsliste, faktaliste, nokkeltall, kontaktinfo, lenkeknapp, innhold,
  tekst, knapper, undersider, ansvarsliste, arrangementer, seksjoner,
  innstillinger, forside, side, nyhet, dokument, dokumentkategori, utvalg, arrangement, nettsidebygg,
];
