const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
const AFAD_FEED = 'https://deprem.afad.gov.tr/apiv2/event/filter';

type UsgsFeature = {
  id: string;
  properties: { mag: number | null; place: string | null; time: number; url: string };
  geometry: { coordinates: [number, number, number] };
};

type AfadEvent = {
  eventID: string;
  location: string;
  latitude: string;
  longitude: string;
  depth: string;
  magnitude: string;
  date: string;
};

type Earthquake = {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: [number, number];
  depth: number;
  url: string;
  source: 'USGS' | 'AFAD';
};

function afadDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

async function loadUsgs() {
  const response = await fetch(USGS_FEED, { headers: { accept: 'application/geo+json, application/json' } });
  if (!response.ok) throw new Error(`USGS ${response.status}`);
  const data = await response.json() as { metadata?: { generated?: number }; features?: UsgsFeature[] };
  const events = (data.features ?? [])
    .filter((feature) => Number.isFinite(feature.properties.mag) && (feature.properties.mag ?? 0) >= 2.5)
    .slice(0, 250)
    .map((feature): Earthquake => ({
      id: `usgs-${feature.id}`,
      magnitude: feature.properties.mag ?? 0,
      place: feature.properties.place ?? 'Konum bilgisi yok',
      time: feature.properties.time,
      coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      depth: feature.geometry.coordinates[2],
      url: feature.properties.url,
      source: 'USGS',
    }));
  return { events, generated: data.metadata?.generated ?? Date.now() };
}

async function loadAfad() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const url = new URL(AFAD_FEED);
  url.searchParams.set('start', afadDate(start));
  url.searchParams.set('end', afadDate(end));
  url.searchParams.set('minlat', '35');
  url.searchParams.set('maxlat', '43');
  url.searchParams.set('minlon', '25');
  url.searchParams.set('maxlon', '46');
  url.searchParams.set('minmag', '0');
  url.searchParams.set('orderby', 'timedesc');
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`AFAD ${response.status}`);
  const data = await response.json() as AfadEvent[];
  return data.slice(0, 500).flatMap((event): Earthquake[] => {
    const magnitude = Number(event.magnitude);
    const latitude = Number(event.latitude);
    const longitude = Number(event.longitude);
    const depth = Number(event.depth);
    const time = Date.parse(`${event.date}+03:00`);
    if (![magnitude, latitude, longitude, depth, time].every(Number.isFinite)) return [];
    return [{
      id: `afad-${event.eventID}`,
      magnitude,
      place: event.location || 'Konum bilgisi yok',
      time,
      coordinates: [latitude, longitude],
      depth,
      url: 'https://deprem.afad.gov.tr/last-earthquakes.html',
      source: 'AFAD',
    }];
  });
}

export async function GET() {
  const [usgs, afad] = await Promise.allSettled([loadUsgs(), loadAfad()]);
  if (usgs.status === 'rejected' && afad.status === 'rejected') {
    return Response.json({ message: 'USGS ve AFAD deprem verilerine şu anda ulaşılamıyor.' }, { status: 502 });
  }
  const globalEvents = usgs.status === 'fulfilled' ? usgs.value.events : [];
  const turkeyEvents = afad.status === 'fulfilled' ? afad.value : [];
  return Response.json({
    globalEvents,
    turkeyEvents,
    generated: usgs.status === 'fulfilled' ? usgs.value.generated : Date.now(),
    sources: { usgs: usgs.status === 'fulfilled', afad: afad.status === 'fulfilled' },
  }, {
      headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
