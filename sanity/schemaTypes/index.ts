import { lenke } from './objects/lenke';
import { seo } from './objects/seo';
import { bilde, dokumentliste, kontaktinfo, medlemsliste, nokkeltall } from './objects/blocks';
import { abcUtgaver, ansvarsliste, arrangementer, borettslagsfakta, faktaboks, fargebaand, generalforsamlinger, nivaaer, sporsmal, oppfordring, oppgaver, punkter, regelverk, relatert, seksjoner, tekst, undersider } from './objects/seksjoner';
import { forsideAktuelt, forsideDokumentsenter, forsideFakta, forsideNaa, forsidePraktisk, forsideSeksjoner } from './objects/forsideSeksjoner';
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
import { nyhetskategori } from './documents/nyhetskategori';
import { vanligSporsmal } from './documents/vanligSporsmal';

export const schemaTypes = [
  lenke, seo, bilde, dokumentliste, medlemsliste, nokkeltall, kontaktinfo,
  tekst, undersider, ansvarsliste, arrangementer, oppgaver, abcUtgaver, fargebaand, borettslagsfakta, punkter, oppfordring, generalforsamlinger, regelverk, nivaaer, relatert, faktaboks, sporsmal, seksjoner,
  forsideFakta, forsideAktuelt, forsideNaa, forsidePraktisk, forsideDokumentsenter, forsideSeksjoner,
  innstillinger, forside, side, nyhet, dokument, dokumentkategori, utvalg, arrangement, nettsidebygg, oppgave, abcUtgave, omBorettslaget, generalforsamling, nyhetskategori, vanligSporsmal,
];
