'use client';

import Image from 'next/image';
import { AlertTriangle, CheckCircle2, FileImage, LoaderCircle, MapPinned, RefreshCw, Satellite, Upload } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import { displayValue, JuryBuilding, JurySimulationResult } from '@/lib/jury-simulation';

type Preview = { url: string; name: string; objectUrl: boolean };
type Phase = 'idle' | 'analyzing' | 'live' | 'error';

function coordinatePercent(value: number) {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
}

function damageClass(level: string) {
  const normalized = level.toLocaleLowerCase('tr-TR');
  if (normalized.includes('yık') || normalized.includes('ağır')) return 'heavy';
  if (normalized.includes('orta')) return 'medium';
  return 'low';
}

function BuildingOverlay({ building, selected, onSelect }: { building: JuryBuilding; selected: boolean; onSelect: () => void }) {
  const left = coordinatePercent(building.x0);
  const top = coordinatePercent(building.y0);
  const width = Math.max(1, coordinatePercent(building.x1) - left);
  const height = Math.max(1, coordinatePercent(building.y1) - top);
  return (
    <button
      type="button"
      className={`backend-building ${damageClass(building.damage_level)} ${selected ? 'selected' : ''}`}
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
      onClick={onSelect}
      title={`Bina ${building.id} · ${building.damage_level} · güven ${Math.round(building.confidence * 100)}%`}
      aria-label={`Bina ${building.id}, ${building.damage_level}`}
    />
  );
}

export function SystemDashboard() {
  const [after, setAfter] = useState<Preview | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<JurySimulationResult | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    if (after?.objectUrl) URL.revokeObjectURL(after.url);
  }, [after]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Yalnızca JPG, PNG veya WEBP görüntüsü seçin.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Görüntü 10 MB sınırını aşmamalıdır.');
      return;
    }
    setAfter({ url: URL.createObjectURL(file), name: file.name, objectUrl: true });
    setResult(null);
    setPhase('idle');
    setMessage('Görüntü hazır. Analiz başlatıldığında backend servisine gönderilecektir.');
  }

  function loadExample() {
    setAfter({ url: '/media/afet-sonrasi-analiz.webp', name: 'örnek-afet-sonrası.webp', objectUrl: false });
    setResult(null);
    setPhase('idle');
    setMessage('Örnek görüntü hazır. Sonuçlar yalnızca gerçek backend cevabı geldikten sonra gösterilecektir.');
  }

  async function startAnalysis() {
    if (!after) {
      setMessage('Önce analiz edilecek bir görüntü seçin veya örnek görüntüyü kullanın.');
      return;
    }
    setPhase('analyzing');
    setMessage('Görüntü gerçek backend analiz servisine gönderiliyor…');
    const formData = new FormData();
    const response = await fetch(after.objectUrl ? after.url : '/media/afet-sonrasi-analiz.webp');
    const blob = await response.blob();
    formData.append('image', new File([blob], after.name, { type: blob.type || 'image/webp' }));

    try {
      const analysisResponse = await fetch('/api/analyze', { method: 'POST', body: formData });
      const payload = await analysisResponse.json() as { error?: string } | JurySimulationResult;
      if (!analysisResponse.ok) throw new Error('error' in payload && payload.error ? payload.error : 'Backend analiz isteği başarısız oldu.');
      setResult(payload as JurySimulationResult);
      setSelectedBuildingId((payload as JurySimulationResult).analysis.buildings[0]?.id ?? null);
      setPhase('live');
      setMessage('Backend sonucu alındı. Aşağıdaki alanlar doğrudan backend payload’ından gösterilmektedir.');
    } catch (error) {
      setPhase('error');
      setMessage(error instanceof Error ? error.message : 'Backend analiz servisi kullanılamıyor.');
    }
  }

  function reset() {
    setResult(null);
    setPhase('idle');
    setSelectedBuildingId(null);
    setMessage('Operasyon paneli sıfırlandı.');
  }

  const buildings = result?.analysis.buildings ?? [];
  const selectedBuilding = buildings.find((building) => building.id === selectedBuildingId) ?? buildings[0];
  const totalTeams = buildings.reduce((sum, building) => sum + building.team_count, 0);

  return (
    <div className="system-workspace">
      <div className="system-notice"><AlertTriangle aria-hidden="true" /><p><b>Backend kaynaklı analiz.</b> Frontend hasar, skor, ekip, rota veya yeniden planlama sonucu üretmez; yalnızca doğrulanmış backend payload’ını görselleştirir.</p></div>

      <section className="single-upload-layout" aria-labelledby="upload-title">
        <article className="upload-card single-upload-card">
          <div className="upload-head"><span id="upload-title">Afet sonrası görüntü</span>{after && <small><CheckCircle2 /> Hazır</small>}</div>
          {after ? <div className="upload-preview"><Image src={after.url} alt="Afet sonrası analiz görüntüsü" fill unoptimized={after.objectUrl} sizes="(max-width: 850px) 92vw, 58vw" /><span>{after.name}</span></div> : <div className="upload-empty"><FileImage /><b>Tek görüntü yeterli</b><p>Güncel uydu, İHA veya hava görüntüsünü seçin.</p></div>}
          <label className="upload-button"><Upload /> Görüntü seç<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectFile} /></label>
          {message && <output className="upload-message">{message}</output>}
        </article>

        <aside className="reference-panel">
          <div><Satellite aria-hidden="true" /><span><b>Backend referans akışı</b><small>Frontend’de sahte referans veya model sonucu yok</small></span></div>
          <ol>
            <li className={after ? 'done' : ''}><span>01</span> Görüntüyü seç</li>
            <li className={phase === 'analyzing' || phase === 'live' ? 'done' : ''}><span>02</span> Backend analizini bekle</li>
            <li className={result ? 'done' : ''}><span>03</span> Backend sonucunu görselleştir</li>
          </ol>
          <p>OSM kaynağı, çözüm süresi, plan kimlikleri ve yeniden yönlendirme bilgileri backend’den okunur.</p>
        </aside>
      </section>

      <div className="dashboard-actions">
        <button type="button" onClick={loadExample}>Örnek görüntüyü kullan</button>
        <button className="run-button" type="button" onClick={startAnalysis} disabled={phase === 'analyzing'}>{phase === 'analyzing' ? <><LoaderCircle className="spin" /> Backend analiz ediyor…</> : 'Backend analizini başlat'}</button>
        <button type="button" onClick={reset}><RefreshCw aria-hidden="true" /> Sıfırla</button>
      </div>

      {result && (
        <section className="operation-console" aria-live="polite">
          <header className="operation-console-head"><div><span className="live-indicator ready"><CheckCircle2 aria-hidden="true" /> Backend sonucu</span><h2>Afet operasyon paneli</h2></div><span>Plan: {result.step7.new_plan.plan_id}</span></header>
          <p className="plan-change-note"><RefreshCw aria-hidden="true" /> {result.step7.replan_summary}</p>

          <div className="operation-metrics">
            <article><strong>{buildings.length}</strong><span>backend’in bildirdiği yapı</span></article>
            <article><strong>{totalTeams}</strong><span>backend’in atadığı ekip</span></article>
            <article><strong>{result.step2.osm_source.toUpperCase()}</strong><span>yol verisi kaynağı</span></article>
            <article><strong>{result.step2.solution_time.toFixed(2)} s</strong><span>backend çözüm süresi</span></article>
          </div>

          <div className="operation-layout">
            <div className="operation-map" aria-label="Backend tarafından döndürülen bina sonuçları">
              <div className="map-grid" aria-hidden="true" />
              {buildings.map((building) => <BuildingOverlay key={building.id} building={building} selected={building.id === selectedBuilding?.id} onSelect={() => setSelectedBuildingId(building.id)} />)}
              <div className="map-legend"><span><i className="legend-critical" /> Bina sonucu</span><span><i className="legend-alternative" /> Seçili bina</span></div>
            </div>

            <aside className="mission-panel">
              <p className="mission-kicker"><MapPinned aria-hidden="true" /> Backend bina sonucu</p>
              <h3>{selectedBuilding ? `Bina ${selectedBuilding.id}` : 'Bina seçin'}</h3>
              {selectedBuilding && <dl>
                <div><dt>Hasar seviyesi</dt><dd>{selectedBuilding.damage_level}</dd></div>
                <div><dt>Model güveni</dt><dd>{Math.round(selectedBuilding.confidence * 100)}%</dd></div>
                <div><dt>Öncelik</dt><dd>{selectedBuilding.priority}</dd></div>
                <div><dt>Skor</dt><dd>{selectedBuilding.score}</dd></div>
                <div><dt>Ekip sayısı</dt><dd>{selectedBuilding.team_count}</dd></div>
              </dl>}
              <p className="mission-warning">Global accuracy gösterilmiyor. Confidence yalnızca modelin bu bina tahminine olan güvenidir.</p>
            </aside>
          </div>

          <div className="operation-bottom-grid">
            <section className="activity-feed"><h3><MapPinned aria-hidden="true" /> Adım 7 · Müdahale planı değişikliği</h3><p><span>01</span>{result.step7.replan_summary}</p><p><span>02</span>Yeniden yönlendirilen ekipler: {result.step7.rerouted_teams.length}</p><p><span>03</span>Ulaşılamayan noktalar: {result.step7.unreachable.length}</p></section>
            <section className="operation-summary"><div><strong>ESKİ</strong><span>{result.step7.old_plan.plan_id}</span></div><div><strong>YENİ</strong><span>{result.step7.new_plan.plan_id}</span></div><div><strong>{result.step7.rerouted_teams.length}</strong><span>yeniden yönlendirilen ekip</span></div><div><strong>{result.step7.unreachable.length}</strong><span>ulaşılamayan nokta</span></div></section>
          </div>

          <section className="plan-integrity-panel"><h3>Plan bütünlüğü</h3><div><h4>Eski plan</h4><pre>{displayValue(result.step7.old_plan)}</pre></div><div><h4>Yeni plan</h4><pre>{displayValue(result.step7.new_plan)}</pre></div><div><h4>Yeniden yönlendirilen ekipler</h4><pre>{displayValue(result.step7.rerouted_teams)}</pre></div><div><h4>Ulaşılamayan noktalar</h4><pre>{displayValue(result.step7.unreachable)}</pre></div><div><h4>Backend rota payload’ı</h4><pre>{displayValue(result.step2.route)}</pre></div></section>
        </section>
      )}
    </div>
  );
}
