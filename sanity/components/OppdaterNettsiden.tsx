// "Oppdater nettsiden" in the Studio's top bar. Publishing doesn't rebuild the site; this button does, by writing
// the `nettsidebygg` document (the Sanity webhook → Cloudflare deploy hook listens only to that type).
// The site's build time is read from /bygg.json, so the button knows which published changes aren't live yet,
// whichever way the last build was started (this button, the nightly rebuild, or a code push).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useClient, useCurrentUser, useSchema, type ToolMenuProps } from 'sanity';
import { Box, Button, Card, Dialog, Flex, Spinner, Stack, Text } from '@sanity/ui';
import { Tooltip } from '@sanity/ui/tooltip';
import { useToast } from '@sanity/ui/toast';
import { BYGG_ID } from '../schemaTypes/documents/nettsidebygg';
import { IkonSvg } from './LucideIkon';

const API = '2026-09-01';
const SJEKK_HVERT = 15_000;
// Any published change (the count refreshes a moment after someone publishes)
const LYTT = `*[!(_id in path("drafts.**")) && !(_id in path("versions.**")) && _type != "${BYGG_ID}"]`;
const PAMINNET = 'oppdater-nettsiden-paminnet';
// Published content changed after the live build. Drafts, uploads (sanity.*) and the trigger itself don't count.
const VENTER = `*[!(_id in path("drafts.**")) && !(_id in path("versions.**")) && !(_type match "sanity.*") && !(_type match "system.*")
  && _type != "${BYGG_ID}" && _updatedAt > $siden] | order(_updatedAt desc)[0...30]{ _id, _type, _updatedAt, "tittel": coalesce(tittel, navn) }`;

type Endring = { _id: string; _type: string; _updatedAt: string; tittel?: string };
const klokke = (iso: string) => new Date(iso).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Build time of the live site (null if /bygg.json isn't there yet) */
async function liveBygg(): Promise<string | null> {
  try {
    const res = await fetch(`/bygg.json?t=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as { tid: string }).tid : null;
  } catch {
    return null;
  }
}

export function OppdaterNettsiden(props: ToolMenuProps) {
  const client = useClient({ apiVersion: API });
  const bruker = useCurrentUser();
  const schema = useSchema();
  const [bygg, setBygg] = useState<string | null>(null);
  const [endringer, setEndringer] = useState<Endring[]>([]);
  const [bestilt, setBestilt] = useState<string | null>(null);
  const [åpen, setÅpen] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const toast = useToast();
  const forrigeAntall = useRef<number | null>(null);

  const oppdater = useCallback(async () => {
    const tid = await liveBygg();
    setBygg(tid);
    setEndringer(tid ? await client.fetch<Endring[]>(VENTER, { siden: tid }) : []);
    // The requested build is live once the site's build time passes the moment we asked for it
    setBestilt((b) => (b && tid && tid > b ? null : b));
  }, [client]);

  useEffect(() => {
    oppdater();
    const t = setInterval(oppdater, bestilt ? SJEKK_HVERT : 60_000);
    return () => clearInterval(t);
  }, [oppdater, bestilt]);

  // Refresh right after anything is published, and when the Studio tab gets focus again
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const sub = client.listen(LYTT, {}, { includeResult: false, visibility: 'query' }).subscribe((e) => {
      if (e.type !== 'mutation') return;
      clearTimeout(t);
      t = setTimeout(oppdater, 500);
    });
    const synlig = () => { if (document.visibilityState === 'visible') oppdater(); };
    document.addEventListener('visibilitychange', synlig);
    return () => { clearTimeout(t); sub.unsubscribe(); document.removeEventListener('visibilitychange', synlig); };
  }, [client, oppdater]);

  // Once per session, the first time a publish adds a waiting change: explain that the site isn't updated yet
  useEffect(() => {
    const n = endringer.length;
    const før = forrigeAntall.current;
    forrigeAntall.current = n;
    if (før === null || n <= før) return;
    try {
      if (sessionStorage.getItem(PAMINNET)) return;
      sessionStorage.setItem(PAMINNET, '1');
    } catch { /* no storage: remind anyway */ }
    toast.push({
      status: 'info',
      duration: 10_000,
      closable: true,
      title: 'Publisert, men ikke ute på nettsiden ennå',
      description: 'Trykk «Oppdater nettsiden» øverst når du er ferdig med endringene.',
    });
  }, [endringer, toast]);

  const bestill = async () => {
    setFeil(null);
    const tid = new Date().toISOString();
    try {
      await client.createOrReplace({ _id: BYGG_ID, _type: BYGG_ID, tidspunkt: tid, av: bruker?.name ?? bruker?.email ?? '' });
      setBestilt(tid);
      setÅpen(false);
    } catch (e) {
      setFeil(`Fikk ikke bestilt oppdateringen: ${(e as Error).message}`);
    }
  };

  const typeNavn = (t: string) => schema.get(t)?.title ?? t;
  const n = endringer.length;
  const venter = n > 0 && !bestilt;
  const antall = `${n === 30 ? '30+' : n} ${n === 1 ? 'endring venter' : 'endringer venter'}`;
  const forklaring = bestilt
    ? 'Nettsiden bygges på nytt. Det tar 1–2 minutter.'
    : venter
      ? `${antall}. Publiserte endringer kommer ut på nettsiden når du trykker her.`
      : 'Alt som er publisert, er ute på nettsiden.';

  const knapp = (
    <Tooltip content={<Box padding={2} style={{ maxWidth: 260 }}><Text size={1}>{forklaring}</Text></Box>} placement="bottom" portal>
      <Button
        mode={venter ? 'default' : 'bleed'}
        tone={venter ? 'positive' : 'default'}
        text={bestilt ? 'Oppdaterer nettsiden …' : venter ? `Oppdater nettsiden · ${antall}` : 'Nettsiden er oppdatert'}
        icon={bestilt ? <Spinner /> : <IkonSvg navn={venter ? 'CloudUpload' : 'CircleCheck'} size="1.15em" />}
        onClick={() => { oppdater(); setÅpen(true); }}
        fontSize={1}
        padding={props.context === 'topbar' ? 2 : 3}
        width={props.context === 'sidebar' ? 'fill' : undefined}
        aria-label={`${bestilt ? 'Oppdaterer nettsiden' : venter ? 'Oppdater nettsiden' : 'Nettsiden er oppdatert'}. ${forklaring}`}
      />
    </Tooltip>
  );

  return (
    <Flex align={props.context === 'topbar' ? 'center' : 'stretch'} direction={props.context === 'topbar' ? 'row' : 'column'} gap={2}>
      {props.renderDefault(props)}
      <Box marginLeft={props.context === 'topbar' ? 2 : 0}>{knapp}</Box>
      {åpen && (
        <Dialog id="oppdater-nettsiden" header="Oppdater nettsiden" onClose={() => setÅpen(false)} width={1}
          footer={
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button mode="bleed" text="Avbryt" onClick={() => setÅpen(false)} />
              <Button tone="primary" text={n ? 'Oppdater nettsiden nå' : 'Oppdater likevel'} onClick={bestill} disabled={!!bestilt} />
            </Flex>
          }>
          <Box padding={4}>
            <Stack gap={4}>
              {bestilt ? (
                <Text>Oppdateringen er bestilt kl. {klokke(bestilt)}. Nettsiden er vanligvis oppdatert etter 1–2 minutter.</Text>
              ) : n ? (
                <>
                  <Text>Dette er publisert, men ikke ute på nettsiden ennå:</Text>
                  <Card border radius={2}>
                    <Stack>
                      {endringer.map((e, i) => (
                        <Card key={e._id} padding={3} borderTop={i > 0}>
                          <Flex gap={3} justify="space-between">
                            <Text size={1} weight="semibold" textOverflow="ellipsis">{e.tittel || typeNavn(e._type)}</Text>
                            <Text size={1} muted>{typeNavn(e._type)} · {klokke(e._updatedAt)}</Text>
                          </Flex>
                        </Card>
                      ))}
                    </Stack>
                  </Card>
                </>
              ) : (
                <Text>Alt som er publisert, er ute på nettsiden{bygg ? ` (oppdatert ${klokke(bygg)})` : ''}.</Text>
              )}
              <Text size={1} muted>Publiser først det du har endret. Har du slettet noe, vises det ikke i listen, men forsvinner fra nettsiden når du oppdaterer. Nettsiden oppdateres også av seg selv hver natt.</Text>
              {feil && <Card tone="critical" padding={3} radius={2}><Text size={1}>{feil}</Text></Card>}
            </Stack>
          </Box>
        </Dialog>
      )}
    </Flex>
  );
}
