// Cover image of an ABC-nytt issue: when a PDF is uploaded (or replaced), page 1 is rendered in the browser with
// pdf.js and saved as the cover. `autoBilde` remembers which image was generated, so a cover an editor uploads
// by hand is never overwritten; `fraFil` remembers which PDF it was made from.
import { useCallback, useEffect, useRef, useState } from 'react';
import { set, useClient, useFormValue, type ObjectInputProps } from 'sanity';
import { Button, Card, Flex, Spinner, Stack, Text } from '@sanity/ui';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const FORSIDE_BREDDE = 800;

type Forside = { asset?: { _ref: string }; fraFil?: string; autoBilde?: string };

async function forsideFraPdf(url: string): Promise<Blob> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const lasting = pdfjs.getDocument({ url });
  try {
    const pdf = await lasting.promise;
    const side = await pdf.getPage(1);
    const viewport = side.getViewport({ scale: FORSIDE_BREDDE / side.getViewport({ scale: 1 }).width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await side.render({ canvas, canvasContext: ctx, viewport }).promise;
    return await new Promise((ok, feil) => canvas.toBlob((b) => (b ? ok(b) : feil(new Error('Kunne ikke lage bildet'))), 'image/jpeg', 0.85));
  } finally {
    await lasting.destroy();
  }
}

export function AbcForsideInput(props: ObjectInputProps) {
  const { onChange, renderDefault } = props;
  const value = props.value as Forside | undefined;
  const filRef = (useFormValue(['fil']) as { asset?: { _ref: string } } | undefined)?.asset?._ref;
  const client = useClient({ apiVersion: '2026-09-01' });
  const [status, setStatus] = useState<'klar' | 'lager' | 'feil'>('klar');
  const [feil, setFeil] = useState('');
  // The PDF a cover is being (or was just) made from: stops a second run before the form value has updated
  const laget = useRef<string | null>(null);

  const lag = useCallback(async (paaNytt = false) => {
    if (!filRef || (!paaNytt && laget.current === filRef)) return;
    laget.current = filRef;
    setStatus('lager');
    try {
      const url = await client.fetch<string | null>('*[_id == $id][0].url', { id: filRef });
      if (!url) throw new Error('Fant ikke PDF-filen');
      const bilde = await forsideFraPdf(url);
      const asset = await client.assets.upload('image', bilde, { filename: `abc-nytt-forside-${filRef.replace(/^file-|-pdf$/g, '').slice(0, 12)}.jpg` });
      onChange(set({ _type: 'image', asset: { _type: 'reference', _ref: asset._id }, fraFil: filRef, autoBilde: asset._id }));
      setStatus('klar');
    } catch (e) {
      setFeil(e instanceof Error ? e.message : String(e));
      setStatus('feil');
    }
  }, [client, filRef, onChange]);

  // New PDF: make a cover when there is none, or when the current one was generated from another PDF
  const erAuto = !!value?.asset && value.asset._ref === value.autoBilde;
  const trengerNy = !!filRef && (!value?.asset || (erAuto && value.fraFil !== filRef));
  useEffect(() => {
    if (trengerNy && status !== 'feil') lag();
  }, [trengerNy, status, lag]);

  return (
    <Stack gap={3}>
      {renderDefault(props)}
      <Card padding={3} radius={2} tone={status === 'feil' ? 'critical' : 'transparent'} border>
        <Flex align="center" gap={3} wrap="wrap">
          {status === 'lager' && <Spinner muted />}
          <Text size={1} muted style={{ flex: 1 }}>
            {status === 'lager'
              ? 'Lager forside fra første side i PDF-en …'
              : status === 'feil'
                ? `Kunne ikke lage forsiden: ${feil}`
                : !filRef
                  ? 'Forsiden lages automatisk når du laster opp PDF-en.'
                  : erAuto
                    ? 'Forsiden er laget automatisk fra første side i PDF-en.'
                    : 'Du har lastet opp denne forsiden selv.'}
          </Text>
          {filRef && status !== 'lager' && <Button text="Lag forside på nytt" mode="ghost" fontSize={1} padding={2} onClick={() => { setStatus('klar'); lag(true); }} />}
        </Flex>
      </Card>
    </Stack>
  );
}
