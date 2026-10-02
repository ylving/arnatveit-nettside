// Train departures from Arna stasjon (front page card, /api/tog). Shared by the Worker and the site.
// Stop place looked up with Entur's geocoder (2026-10-02): "Arna stasjon", railStation, Bergen. Not "Arna Gamle stasjon".
export const TOG = {
  stoppested: 'NSR:StopPlace:398',
  entur: 'https://api.entur.io/journey-planner/v3/graphql',
  // Required by Entur: identifies us in their logs
  klientnavn: 'arnatveitborettslag-nettside',
  avgangstavle: 'https://entur.no/nearby-stop-place-detail?id=NSR:StopPlace:398',
  // Entur has no direction for these lines ("unknown"); trains towards Bergen show "Bergen" as destination
  // (L4 platform 2, R40 platform 1), the other way "Voss", "Myrdal", "Oslo S" (platform 3). Checked against live data.
  motBergen: (destinasjon: string) => /^bergen\b/i.test(destinasjon.trim()),
  antall: 3,
} as const;

export type Avgang = { aimed: string; expected: string; realtime: boolean; cancelled: boolean; platform: string | null };
export type TogSvar = { status: 'ok' | 'stale' | 'unavailable'; avganger: Avgang[] };
