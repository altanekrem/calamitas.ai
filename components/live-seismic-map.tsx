'use client';

import { Globe2, MapPin, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CircleMarker, Map as LeafletMap } from 'leaflet';

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

type SeismicResponse = {
  globalEvents: Earthquake[];
  turkeyEvents: Earthquake[];
  generated: number;
  sources: { usgs: boolean; afad: boolean };
};

const FEED = '/api/earthquakes';
const TURKEY_BOUNDS: [[number, number], [number, number]] = [[35, 25], [43, 46]];

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
  const markers = useRef(new Map<string, CircleMarker>());
  const [mode, setMode] = useState<'world' | 'turkey'>('world');
  const [globalEvents, setGlobalEvents] = useState<Earthquake[]>([]);
  const [turkeyEvents, setTurkeyEvents] = useState<Earthquake[]>([]);
  const [sources, setSources] = useState({ usgs: false, afad: false });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const activeEvents = useMemo(() => mode === 'world' ? globalEvents : turkeyEvents, [globalEvents, mode, turkeyEvents]);
  const strongest = useMemo(() => activeEvents.reduce<Earthquake | null>((best, event) => !best || event.magnitude > best.magnitude ? event : best, null), [activeEvents]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch(FEED, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Deprem akışı ${response.status}`);
      const data = await response.json() as SeismicResponse;
      setGlobalEvents(data.globalEvents ?? []);
      setTurkeyEvents(data.turkeyEvents ?? []);
      setSources(data.sources ?? { usgs: false, afad: false });
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
        map.current = L.map(mapNode.current, { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap katkıcıları',
          maxZoom: 18,
        }).addTo(map.current);
        markerLayer.current = L.layerGroup().addTo(map.current);
        if (mode === 'turkey') map.current.fitBounds(TURKEY_BOUNDS, { padding: [16, 16] });
      }
      markerLayer.current?.clearLayers();
      markers.current.clear();
      activeEvents.forEach((event) => {
        const marker = L.circleMarker(event.coordinates, {
          radius: Math.max(5, Math.min(18, 4 + event.magnitude * 1.55)),
          color: '#121E2E',
          weight: 1.25,
          fillColor: event.magnitude >= 5 ? '#C62828' : mode === 'turkey' ? '#1E3A5F' : '#C62828',
          fillOpacity: 0.8,
        });
        const popup = document.createElement('div');
        popup.className = 'map-popup';
        const strong = document.createElement('strong');
        strong.textContent = `M ${event.magnitude.toFixed(1)} · ${event.source}`;
        const place = document.createElement('span');
        place.textContent = event.place;
        const detail = document.createElement('small');
        detail.textContent = `${new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(event.time)} · ${event.depth.toFixed(1)} km derinlik`;
        const link = document.createElement('a');
        link.href = event.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = `${event.source} kaydını aç`;
        popup.appendChild(strong);
        popup.appendChild(place);
        popup.appendChild(detail);
        popup.appendChild(link);
        marker.bindPopup(popup).addTo(markerLayer.current!);
        markers.current.set(event.id, marker);
      });
    }
    void renderMap().catch(() => setStatus('error'));
    return () => { cancelled = true; };
  }, [activeEvents, mode]);

  useEffect(() => {
    if (!map.current) return;
    if (mode === 'turkey') map.current.fitBounds(TURKEY_BOUNDS, { padding: [16, 16], animate: true });
    else map.current.setView([20, 0], 2, { animate: true });
  }, [mode]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  function focusEvent(event: Earthquake) {
    map.current?.flyTo(event.coordinates, mode === 'turkey' ? 9 : 6, { duration: 0.8 });
    markers.current.get(event.id)?.openPopup();
  }

  const sourceReady = mode === 'world' ? sources.usgs : sources.afad;
  const rangeText = mode === 'world' ? 'Son 24 saat · M 2,5+' : 'Son 7 gün · tüm büyüklükler';

  return (
    <div className="seismic-layout">
      <div className="map-panel">
        <div ref={mapNode} className="seismic-map" aria-label={mode === 'world' ? 'Son 24 saatteki depremleri gösteren dünya haritası' : 'Son 7 gündeki depremleri gösteren ayrıntılı Türkiye haritası'} />
        <div className="map-status">
          <span className={`status-dot ${status}`} />
          {status === 'loading' ? 'Canlı deprem verisi güncelleniyor' : status === 'ready' ? `${activeEvents.length} olay gösteriliyor` : 'Canlı veri alınamadı'}
        </div>
        <fieldset className="map-mode-switch">
          <legend className="sr-only">Harita bölgesi</legend>
          <button type="button" aria-pressed={mode === 'world'} onClick={() => setMode('world')}><Globe2 aria-hidden="true" /> Dünya</button>
          <button type="button" aria-pressed={mode === 'turkey'} onClick={() => setMode('turkey')}><MapPin aria-hidden="true" /> Türkiye</button>
        </fieldset>
      </div>
      <aside className="event-panel">
        <div className="event-head">
          <div><span>{mode === 'world' ? 'Dünya görünümü' : 'Türkiye ayrıntısı'}</span><b>{rangeText}</b></div>
          <button type="button" onClick={() => { void load(); }} disabled={status === 'loading'} aria-label="Deprem verisini yenile"><RefreshCw className={status === 'loading' ? 'spin' : ''} /></button>
        </div>
        <div className="event-summary" aria-label="Deprem özeti">
          <span><small>Olay sayısı</small><strong>{activeEvents.length}</strong></span>
          <span><small>En yüksek</small><strong>{strongest ? `M ${strongest.magnitude.toFixed(1)}` : '—'}</strong></span>
        </div>
        {status === 'error' ? (
          <div className="map-error"><TriangleAlert /><p>Canlı veri kaynaklarına ulaşılamadı. Yeniden deneyebilirsiniz.</p></div>
        ) : !sourceReady && status === 'ready' ? (
          <div className="map-error"><TriangleAlert /><p>{mode === 'world' ? 'USGS' : 'AFAD'} akışı geçici olarak kullanılamıyor. Diğer görünümü kullanabilir veya yenileyebilirsiniz.</p></div>
        ) : activeEvents.length === 0 && status === 'ready' ? (
          <div className="map-error"><MapPin /><p>Seçilen zaman ve bölge aralığında kayıt bulunmadı.</p></div>
        ) : (
          <ol className="event-list">
            {activeEvents.slice(0, mode === 'turkey' ? 12 : 8).map((event) => (
              <li key={event.id}><button type="button" onClick={() => focusEvent(event)} aria-label={`${event.place}, M ${event.magnitude.toFixed(1)}; haritada göster`}><strong>{event.magnitude.toFixed(1)}</strong><span><b>{event.place}</b><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(event.time)} · {event.depth.toFixed(1)} km · {event.source}</small></span></button></li>
            ))}
          </ol>
        )}
        <p className="data-note">Kaynaklar: Dünya için USGS, Türkiye ayrıntısı için AFAD. {updatedAt && `Akış üretim zamanı ${updatedAt.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}.`} Veriler iki dakikada bir yenilenir; bu ekran erken uyarı sistemi değildir.</p>
      </aside>
    </div>
  );
}
