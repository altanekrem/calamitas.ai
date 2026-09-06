const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

type UsgsFeature = {
  id: string;
  properties: { mag: number | null; place: string | null; time: number; url: string };
  geometry: { coordinates: [number, number, number] };
};

export async function GET() {
  try {
    const response = await fetch(USGS_FEED, {
      headers: { accept: 'application/geo+json, application/json' },
    });
    if (!response.ok) throw new Error(`USGS ${response.status}`);
    const data = await response.json() as { metadata?: { generated?: number }; features?: UsgsFeature[] };
    const events = (data.features ?? [])
      .filter((feature) => Number.isFinite(feature.properties.mag) && (feature.properties.mag ?? 0) >= 2.5)
      .slice(0, 120)
      .map((feature) => ({
        id: feature.id,
        magnitude: feature.properties.mag ?? 0,
        place: feature.properties.place ?? 'Konum bilgisi yok',
        time: feature.properties.time,
        coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [number, number],
        depth: feature.geometry.coordinates[2],
        url: feature.properties.url,
      }));

    return Response.json({ events, generated: data.metadata?.generated ?? Date.now() }, {
      headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch {
    return Response.json({ message: 'USGS deprem verisine şu anda ulaşılamıyor.' }, { status: 502 });
  }
}
