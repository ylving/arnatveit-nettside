// Visual icon picker for `side.ikon`: shows the icons themselves, with search (English names + common Norwegian words)
import { createElement, useMemo, useState } from 'react';
import { set, unset, type StringInputProps } from 'sanity';
import { Box, Button, Card, Dialog, Flex, Grid, Stack, Text, TextInput } from '@sanity/ui';
import { erIkon, ikonNavn, ikonNode, lesbartNavn } from '../ikoner';
import { STANDARD_IKON } from '../standarder';

const MAKS_TREFF = 120;

// Lucide names are English. Norwegian search words → English terms (extend as needed).
const NORSKE_ORD: Record<string, string> = {
  hus: 'house home building', hjem: 'house home', bygg: 'building', 'dør': 'door', lys: 'lamp lightbulb',
  kalender: 'calendar', dato: 'calendar', tid: 'clock timer', klokke: 'clock alarm',
  dokument: 'file', skjema: 'clipboard file', bok: 'book', avis: 'newspaper', nyhet: 'newspaper megaphone',
  'møte': 'users', person: 'user', folk: 'users', gruppe: 'users', styre: 'users shield',
  penger: 'banknote coins wallet', 'økonomi': 'banknote chart piggy', regning: 'receipt',
  bil: 'car', parkering: 'parking car', sykkel: 'bike', buss: 'bus', tog: 'train',
  'søppel': 'trash', avfall: 'trash recycle', gjenvinning: 'recycle',
  'nøkkel': 'key', 'lås': 'lock', sikkerhet: 'shield lock', skjold: 'shield', regler: 'scale book gavel', lov: 'scale gavel',
  telefon: 'phone', epost: 'mail', 'e-post': 'mail', post: 'mail mailbox', melding: 'message', kart: 'map',
  info: 'info', hjelp: 'help life buoy', 'spørsmål': 'help question', advarsel: 'alert triangle',
  'strøm': 'zap plug', vann: 'droplet', varme: 'flame thermometer heater', brann: 'flame fire extinguisher',
  tre: 'tree', blomst: 'flower', plante: 'sprout leaf', hage: 'shovel flower sprout', dugnad: 'shovel hammer sprout',
  barn: 'baby', lek: 'toy blocks', hund: 'dog', katt: 'cat', 'verktøy': 'wrench hammer', fest: 'party',
  sol: 'sun', 'snø': 'snowflake', regn: 'cloud rain', hjerte: 'heart', stjerne: 'star', bilde: 'image', kamera: 'camera',
};

const lesbar = new Map(ikonNavn.map((n) => [n, lesbartNavn(n)]));

export function søk(q: string): string[] {
  const s = q.trim().toLowerCase();
  if (!s) return ikonNavn;
  const termer = [s];
  if (s.length >= 2) for (const [nb, en] of Object.entries(NORSKE_ORD)) if (nb.startsWith(s)) termer.push(...en.split(' '));
  return ikonNavn.filter((n) => {
    const l = lesbar.get(n)!;
    const tett = l.replace(/ /g, '');
    return termer.some((t) => l.includes(t) || tett.includes(t.replace(/ /g, '')));
  });
}

function IkonSvg({ navn, size = 24 }: { navn?: string; size?: number }) {
  return createElement(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    ikonNode(navn).map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
  );
}

export function IkonVelger(props: StringInputProps) {
  const { value, onChange, readOnly, elementProps, id } = props;
  const [åpen, setÅpen] = useState(false);
  const [q, setQ] = useState('');
  const treff = useMemo(() => søk(q), [q]);
  const valgt = erIkon(value) ? value : undefined;
  const lukk = () => { setÅpen(false); setQ(''); };

  return (
    <>
      {/* Collapsed: current icon + actions. The grid only opens in a dialog. */}
      <Card border radius={2} padding={3} tone={value && !valgt ? 'caution' : 'default'}>
        <Flex align="center" gap={3}>
          <Card radius={2} padding={2} tone="primary"><IkonSvg navn={valgt} size={28} /></Card>
          <Box flex={1}>
            <Stack gap={2}>
              <Text weight="semibold">{valgt ? lesbartNavn(valgt) : value ? `Ukjent ikon «${value}»` : 'Ingen valgt'}</Text>
              {!valgt && <Text size={1} muted>Kortet viser standardikonet ({lesbartNavn(STANDARD_IKON)}).</Text>}
            </Stack>
          </Box>
          <Flex gap={2}>
            <Button {...elementProps} mode="ghost" text={valgt ? 'Bytt ikon' : 'Velg ikon'} disabled={readOnly} onClick={() => setÅpen(true)} />
            {value && <Button mode="bleed" tone="critical" text="Fjern" disabled={readOnly} onClick={() => onChange(unset())} />}
          </Flex>
        </Flex>
      </Card>

      {åpen && (
        <Dialog id={`${id}-ikonvelger`} header="Velg ikon" onClose={lukk} onClickOutside={lukk} width={2}>
          <Stack gap={3} padding={4}>
            <TextInput value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Søk, f.eks. hus, møte, calendar …" autoFocus />
            <Grid gridTemplateColumns={[4, 6, 8]} gap={1}>
              {treff.slice(0, MAKS_TREFF).map((navn) => (
                <Button
                  key={navn}
                  mode={navn === valgt ? 'default' : 'bleed'}
                  tone={navn === valgt ? 'primary' : 'default'}
                  padding={2}
                  title={lesbartNavn(navn)}
                  aria-label={lesbartNavn(navn)}
                  aria-pressed={navn === valgt}
                  onClick={() => { onChange(set(navn)); lukk(); }}
                >
                  <Stack gap={2}>
                    <Flex justify="center"><IkonSvg navn={navn} /></Flex>
                    <Text size={0} align="center" textOverflow="ellipsis" muted={navn !== valgt}>{lesbartNavn(navn)}</Text>
                  </Stack>
                </Button>
              ))}
            </Grid>
            <Text size={1} muted>
              {treff.length === 0
                ? 'Ingen ikoner passer søket. Prøv et engelsk ord.'
                : treff.length > MAKS_TREFF
                  ? `Viser ${MAKS_TREFF} av ${treff.length} ikoner – søk for å finne flere.`
                  : `${treff.length} ${treff.length === 1 ? 'ikon' : 'ikoner'}.`}
            </Text>
          </Stack>
        </Dialog>
      )}
    </>
  );
}
