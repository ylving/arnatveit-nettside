import { bakgrunnFor, type Bakgrunn } from '../../sanity/standarder';

/** Splits sections into runs of the same background, so neighbours with the same colour share one band.
 *  Runs without a background ('ingen') are rendered without a wrapper. */
export function iBaand<T extends { _type: string; bakgrunn?: Bakgrunn }>(liste: T[]): { bakgrunn: Bakgrunn; seksjoner: T[] }[] {
  const grupper: { bakgrunn: Bakgrunn; seksjoner: T[] }[] = [];
  for (const s of liste) {
    const b = bakgrunnFor(s);
    const siste = grupper.at(-1);
    if (siste?.bakgrunn === b) siste.seksjoner.push(s);
    else grupper.push({ bakgrunn: b, seksjoner: [s] });
  }
  return grupper;
}
