import { lenke } from './objects/lenke';
import { seo } from './objects/seo';
import { bilde, dokumentliste, faktaliste, infoboks, innhold, kontaktinfo, lenkeknapp, medlemsliste, nokkeltall } from './objects/blocks';
import { abcUtgaver, ansvarsliste, arrangementer, borettslagsfakta, dokumentsok, fargebaand, generalforsamlinger, knapper, oppfordring, oppgaver, punkter, seksjoner, tekst, undersider } from './objects/seksjoner';
import { innstillinger } from './documents/innstillinger';
import { forside } from './documents/forside';
import { side } from './documents/side';
import { nyhet } from './documents/nyhet';
import { dokument } from './documents/dokument';
import { dokumentkategori } from './documents/dokumentkategori';
import { utvalg } from './documents/utvalg';
import { arrangement } from './documents/arrangement';
import { nettsidebygg } from './documents/nettsidebygg';
import { oppgave } from './documents/oppgave';
import { abcUtgave } from './documents/abcUtgave';
import { omBorettslaget } from './documents/omBorettslaget';
import { generalforsamling } from './documents/generalforsamling';

export const schemaTypes = [
  lenke, seo, bilde, infoboks, dokumentliste, medlemsliste, faktaliste, nokkeltall, kontaktinfo, lenkeknapp, innhold,
  tekst, knapper, undersider, ansvarsliste, arrangementer, oppgaver, dokumentsok, abcUtgaver, fargebaand, borettslagsfakta, punkter, oppfordring, generalforsamlinger, seksjoner,
  innstillinger, forside, side, nyhet, dokument, dokumentkategori, utvalg, arrangement, nettsidebygg, oppgave, abcUtgave, omBorettslaget, generalforsamling,
];
