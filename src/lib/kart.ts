// Map of the area (the «Området» band on Om oss og kontakt): MapLibre with OpenFreeMap's Positron style (OpenStreetMap
// data, no API key), recoloured in the site's tones. Coordinates checked 2026-10-02: the borettslag = Stuajordet
// (OpenStreetMap), Arna stasjon (Entur, NSR:StopPlace:398), Øyrane Torg (OpenStreetMap, the shopping centre).
export const KART = {
  stil: 'https://tiles.openfreemap.org/styles/positron',
  steder: [
    { navn: 'Arnatveit Borettslag', type: 'borettslag', lnglat: [5.48054, 60.40545] },
    { navn: 'Arna stasjon', type: 'tog', lnglat: [5.46609, 60.420097] },
    { navn: 'Øyrane Torg', type: 'handel', lnglat: [5.465742, 60.421274] },
  ],
  // Layer id prefix → colour (Positron's layers; checked 2026-10-02). Land is the page's sand, roads white, nature green-grey.
  farger: {
    background: '#efebe1',
    park: '#dfe6dc', landcover_wood: '#dbe3d6', landuse_residential: '#e9e4d8',
    water: '#d5dfe4', waterway: '#c9d6dd', building: '#e3ddd0',
    highway_path: '#ffffff', highway_minor: '#ffffff', highway_major_inner: '#ffffff', highway_major_subtle: '#ffffff',
    highway_major_casing: '#ddd6c8', highway_motorway_inner: '#ffffff', highway_motorway_subtle: '#ffffff', highway_motorway_casing: '#d3cbbb',
    railway: '#b9c1bb', railway_dashline: '#efebe1', railway_transit: '#b9c1bb', railway_service: '#c6cdc7',
  } as Record<string, string>,
  // Not useful at this scale
  skjul: ['boundary_', 'highway-shield', 'road_shield', 'label_country', 'label_state', 'airport', 'aeroway'],
} as const;
