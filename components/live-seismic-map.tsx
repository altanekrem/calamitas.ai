'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';

type Earthquake = {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: [number, number];
  depth: number;
  url: string;
};

const FEED = '/api/earthquakes';

function loadLeaflet() {
  return new Promise<typeof import('leaflet')>((resolve, reject) => {
    const leafletWindow = window as Window & { L?: typeof import('leaflet') };
    if (leafletWindow.L?.map) {
      resolve(leafletWindow.L);
      return;
    }

    const finish = () => leafletWindow.L?.map ? resolve(leafletWindow.L) : reject(new Error('Harita kitaplığı başlatılamadı.'));
    const existing = document.querySelector<HTMLScriptElement>('script[data-calamitas-leaflet]');
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Harita kitaplığı yüklenemedi.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/vendor/leaflet.js';
    script.dataset.calamitasLeaflet = 'true';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Harita kitaplığı yüklenemedi.')), { once: true });
    document.head.appendChild(script);
  });
}

export function LiveSeismicMap() {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<import('leaflet').LayerGroup | null>(null);
  const [events, setEvents] = useState<Earthquake[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch(FEED, { cache: 'no-store' });
      if (!response.ok) throw new Error(`USGS ${response.status}`);
      const data = await response.json() as { events: Earthquake[]; generated: number };
      setEvents(data.events);
      setUpdatedAt(new Date(data.generated));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const kickoff = window.setTimeout(() => { void load(); }, 0);
    const interval = window.setInterval(() => { void load(); }, 120_000);
    return () => { window.clearTimeout(kickoff); window.clearInterval(interval); };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!mapNode.current) return;
      const L = await loadLeaflet();
      if (cancelled) return;
      if (!map.current) {
        map.current = L.map(mapNode.current, { scrollWheelZoom: false, worldCopyJump: true }).setView([35, 22], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap katkıcıları',
          maxZoom: 18,
        }).addTo(map.current);
        markerLayer.current = L.layerGroup().addTo(map.current);
      }
      markerLayer.current?.clearLayers();
      events.forEach((event) => {
        const marker = L.circleMarker(event.coordinates, {
          radius: Math.max(5, event.magnitude * 1.7),
          color: '#7e1519',
          weight: 1,
          fillColor: event.magnitude >= 5 ? '#ff3b42' : '#cf2d32',
          fillOpacity: 0.76,
        });
        const popup = document.createElement('div');
        popup.className = 'map-popup';
        const strong = document.createElement('strong');
        strong.textContent = `M ${event.magnitude.toFixed(1)}`;
        const place = document.createElement('span');
        place.textContent = event.place;
        const depth = document.createElement('small');
        depth.textContent = `Derinlik: ${event.depth.toFixed(1)} km`;
        const link = document.createElement('a');
        link.href = event.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = 'USGS kaydını aç';
        popup.appendChild(strong);
        popup.appendChild(place);
        popup.appendChild(depth);
        popup.appendChild(link);
        marker.bindPopup(popup).addTo(markerLayer.current!);
      });
    }
    void renderMap().catch(() => setStatus('error'));
    return () => { cancelled = true; };
  }, [events]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  return (
    <div className="seismic-layout">
      <div className="map-panel">
        <div ref={mapNode} className="seismic-map" aria-label="Son 24 saatteki depremleri gösteren dünya haritası" />
        <div className="map-status">
          <span className={`status-dot ${status}`} />
          {status === 'loading' ? 'USGS verisi güncelleniyor' : status === 'ready' ? `${events.length} güncel olay gösteriliyor` : 'Veri alınamadı'}
        </div>
      </div>
      <aside className="event-panel">
        <div className="event-head">
          <div><span>Son 24 saat</span><b>M 2,5 ve üzeri</b></div>
          <button type="button" onClick={() => { void load(); }} disabled={status === 'loading'} aria-label="Deprem verisini yenile"><RefreshCw className={status === 'loading' ? 'spin' : ''} /></button>
        </div>
        {status === 'error' ? (
          <div className="map-error"><TriangleAlert /><p>Canlı veri kaynağına ulaşılamadı. Yeniden deneyebilirsiniz.</p></div>
        ) : (
          <ol className="event-list">
            {events.slice(0, 6).map((event) => (
              <li key={event.id}><strong>{event.magnitude.toFixed(1)}</strong><span><b>{event.place}</b><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(event.time)} · {event.depth.toFixed(1)} km</small></span></li>
            ))}
          </ol>
        )}
        <p className="data-note">Kaynak: USGS Earthquake Hazards Program. {updatedAt && `Akış üretim zamanı ${updatedAt.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}.`} Veri iki dakikada bir yenilenir; bu ekran erken uyarı sistemi değildir.</p>
      </aside>
    </div>
  );
}
