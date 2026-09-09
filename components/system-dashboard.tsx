'use client';

import Image from 'next/image';
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  LifeBuoy,
  LoaderCircle,
  MapPinned,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Route,
  Satellite,
  ShieldCheck,
  Siren,
  Upload,
  UserRoundCheck,
  WifiOff,
} from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import type { JurySimulationResult } from '@/types/jury';

type Preview = { url: string; name: string; objectUrl: boolean };
type Phase = 'idle' | 'analyzing' | 'planning' | 'live';
type MissionStatus = 'Müsait' | 'Görev Atandı' | 'Görevi Kabul Etti' | 'Yola Çıktı' | 'Bölgeye Ulaştı' | 'Görevde' | 'Görev Tamamlandı' | 'Yardım Gerekiyor';
type GridPoint = { col: number; row: number; x: number; y: number };
type HelpRequest = { requesterId: number; targetId: string };
type JuryStep = 'step_2' | 'step_7';

const JURY_FIXTURE_URL = '/fixtures/jury_simulation_step2_step7.json';

const GRID_X = [5, 18, 31, 44, 57, 70, 83, 96];
const GRID_Y = [6, 20, 34, 48, 62, 76, 91];

const BUILDINGS = Array.from({ length: 42 }, (_, index) => ({
  id: `B-${String(index + 1).padStart(2, '0')}`,
  x: 8 + (index % 7) * 13.7,
  y: 10 + Math.floor(index / 7) * 15.4,
  severity: index % 11 === 0 ? 'heavy' : index % 5 === 0 ? 'medium' : 'low',
}));

const CRITICAL_BUILDING_INDICES = [2, 6, 9, 17, 23, 31, 36, 40, 12, 27];
const TARGET_NAMES = ['Kuzey Blok', 'Çınar Apartmanı', 'Sağlık Noktası', 'Okul Bölgesi', 'Sanayi Girişi', 'Güney Blok', 'İstasyon Caddesi', 'Toplanma Alanı', 'Pazar Alanı', 'Dere Geçişi'];
const ROLE_PROFILES = [
  { role: 'Arama kurtarma', skills: 'Enkaz arama · tahliye', equipment: 'Termal kamera · kesici set', vehicle: '4×4 müdahale aracı' },
  { role: 'Sağlık desteği', skills: 'Triyaj · ilk yardım', equipment: 'Travma çantası · sedye', vehicle: 'Ambulans' },
  { role: 'Lojistik', skills: 'Malzeme sevki · kurulum', equipment: 'Jeneratör · aydınlatma', vehicle: 'Lojistik kamyoneti' },
  { role: 'Güvenlik', skills: 'Çevre güvenliği · tahliye', equipment: 'Bariyer seti · telsiz', vehicle: 'Devriye aracı' },
  { role: 'Enkaz değerlendirme', skills: 'Yapı gözlemi · risk işaretleme', equipment: 'Lazer metre · sensör seti', vehicle: 'Teknik inceleme aracı' },
  { role: 'İletişim', skills: 'Saha ağı · koordinasyon', equipment: 'Uydu terminali · röle', vehicle: 'Haberleşme aracı' },
] as const;

const TARGETS = CRITICAL_BUILDING_INDICES.map((buildingIndex, index) => {
  const profile = ROLE_PROFILES[index % ROLE_PROFILES.length];
  return {
    ...BUILDINGS[buildingIndex],
    index,
    name: TARGET_NAMES[index],
    entry: index % 2 ? 'Doğu giriş' : 'Kuzey giriş',
    priority: 1 + (index % 3),
    capacity: 3 + (index % 4),
    requiredRole: profile.role,
    requiredEquipment: profile.equipment,
    risk: index % 3 === 0 ? 'İkincil çökme ve dar geçiş' : index % 3 === 1 ? 'Enkaz ve kesintili yol' : 'Yoğun saha trafiği',
  };
});

const PEOPLE = Array.from({ length: 36 }, (_, index) => {
  const profile = ROLE_PROFILES[index % ROLE_PROFILES.length];
  return {
    id: index + 1,
    name: `Personel ${String(index + 1).padStart(2, '0')}`,
    team: `Ekip ${String.fromCharCode(65 + (index % 6))}`,
    ...profile,
    startX: GRID_X[index % GRID_X.length],
    startY: GRID_Y[6 - (Math.floor(index / GRID_X.length) % 2)],
    device: `SAHA-${String(index + 1).padStart(3, '0')}`,
    eta: 4 + (index % 7),
  };
});

const CLOSURES = [
  { col: 4, row: 2, label: 'Köprü geçişi kapalı' },
  { col: 3, row: 4, label: 'Yeni yol kapanması' },
  { col: 6, row: 3, label: 'Enkaz nedeniyle geçiş yok' },
];

function keyOf(point: Pick<GridPoint, 'col' | 'row'>) { return `${point.col}:${point.row}`; }
function pointAt(col: number, row: number): GridPoint { return { col, row, x: GRID_X[col], y: GRID_Y[row] }; }

function nearestGridPoint(x: number, y: number) {
  const col = GRID_X.reduce((best, value, index) => Math.abs(value - x) < Math.abs(GRID_X[best] - x) ? index : best, 0);
  const row = GRID_Y.reduce((best, value, index) => Math.abs(value - y) < Math.abs(GRID_Y[best] - y) ? index : best, 0);
  return pointAt(col, row);
}

function findPath(start: GridPoint, end: GridPoint, blocked: Set<string>) {
  const queue: GridPoint[][] = [[start]];
  const visited = new Set([keyOf(start)]);
  const directions = [[0, -1], [-1, 0], [1, 0], [0, 1]] as const;

  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (current.col === end.col && current.row === end.row) return path;
    for (const [dc, dr] of directions) {
      const col = current.col + dc;
      const row = current.row + dr;
      if (col < 0 || col >= GRID_X.length || row < 0 || row >= GRID_Y.length) continue;
      const next = pointAt(col, row);
      const key = keyOf(next);
      if (visited.has(key) || (blocked.has(key) && key !== keyOf(end))) continue;
      visited.add(key);
      queue.push([...path, next]);
    }
  }
  return [start, end];
}

function assignmentScore(person: typeof PEOPLE[number], target: typeof TARGETS[number]) {
  const distance = Math.abs(person.startX - target.x) + Math.abs(person.startY - target.y);
  const role = person.role === target.requiredRole ? 58 : 12;
  const equipment = person.equipment === target.requiredEquipment ? 24 : 5;
  const vehicle = target.risk.includes('dar') && person.vehicle.includes('4×4') ? 14 : 7;
  const priority = (4 - target.priority) * 12;
  return Math.max(0, Math.min(100, Math.round(role + equipment + vehicle + priority - distance * .22)));
}

function routeKey(path: GridPoint[]) { return path.map(keyOf).join('|'); }

function buildRoutePlans(criticalCount: number, closureCount: number, helpRequests: HelpRequest[]) {
  const targets = TARGETS.slice(0, criticalCount);
  const blocked = new Set(CLOSURES.slice(0, closureCount).map(keyOf));
  const helpers = new Map<number, string>();
  helpRequests.forEach((request, index) => helpers.set(PEOPLE.length - index, request.targetId));

  return PEOPLE.map((person) => {
    const requestedTarget = helpers.get(person.id);
    const requested = requestedTarget ? targets.find((target) => target.id === requestedTarget) : null;
    const coverageAssignment = person.id <= targets.length ? targets[person.id - 1] : null;
    const scoredTarget = [...targets].sort((a, b) => assignmentScore(person, b) - assignmentScore(person, a) || a.index - b.index)[0];
    const target = requested ?? coverageAssignment ?? scoredTarget;
    const start = nearestGridPoint(person.startX, person.startY);
    const end = nearestGridPoint(target.x, target.y);
    const path = findPath(start, end, blocked);
    const detourPoint = path.length > 2 ? path[Math.floor(path.length / 2)] : null;
    const alternativeBlocked = new Set(blocked);
    if (detourPoint && keyOf(detourPoint) !== keyOf(start) && keyOf(detourPoint) !== keyOf(end)) alternativeBlocked.add(keyOf(detourPoint));
    const alternative = findPath(start, end, alternativeBlocked);
    return { person, target, path, alternative, score: assignmentScore(person, target), isSupport: Boolean(requestedTarget) };
  });
}

function pointAlongPath(path: GridPoint[], ratio: number) {
  if (path.length < 2) return path[0] ?? pointAt(0, 0);
  const lengths = path.slice(1).map((point, index) => Math.hypot(point.x - path[index].x, point.y - path[index].y));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let remaining = total * Math.max(0, Math.min(1, ratio));
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const start = path[index];
      const end = path[index + 1];
      const segmentRatio = lengths[index] ? remaining / lengths[index] : 0;
      return { ...start, x: start.x + (end.x - start.x) * segmentRatio, y: start.y + (end.y - start.y) * segmentRatio };
    }
    remaining -= lengths[index];
  }
  return path[path.length - 1];
}

function personStatus(progress: number, phase: Phase, index: number, acknowledged: boolean, helpNeeded: boolean): MissionStatus {
  if (helpNeeded) return 'Yardım Gerekiyor';
  if (phase === 'idle' || phase === 'analyzing') return 'Müsait';
  if (phase === 'planning') return 'Görev Atandı';
  const personalProgress = Math.min(100, progress + (index % 6) * 4);
  if (personalProgress < 18) return acknowledged ? 'Görevi Kabul Etti' : 'Görev Atandı';
  if (personalProgress < 67) return 'Yola Çıktı';
  if (personalProgress < 82) return 'Bölgeye Ulaştı';
  if (personalProgress < 98) return 'Görevde';
  return 'Görev Tamamlandı';
}

function countPlanChanges(current: ReturnType<typeof buildRoutePlans>, next: ReturnType<typeof buildRoutePlans>) {
  return next.filter((plan, index) => plan.target.id !== current[index]?.target.id || routeKey(plan.path) !== routeKey(current[index]?.path ?? [])).length;
}

function routeLabel(path: GridPoint[], entry: string) {
  const checkpoints = Math.max(0, path.length - 2);
  return `Toplanma ${(path[0]?.col ?? 0) + 1} → ${checkpoints} kontrol noktası → ${entry}`;
}

export function SystemDashboard() {
  const [after, setAfter] = useState<Preview | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [revision, setRevision] = useState(1);
  const [closureCount, setClosureCount] = useState(1);
  const [criticalCount, setCriticalCount] = useState(8);
  const [routeUpdates, setRouteUpdates] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState(17);
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [fileMessage, setFileMessage] = useState('');
  const [activity, setActivity] = useState(['Operasyon senaryosu analize hazır.']);
  const [planChange, setPlanChange] = useState('v1 · Başlangıç planı hazırlanmayı bekliyor.');
  const [juryResult, setJuryResult] = useState<JurySimulationResult | null>(null);
  const [juryStep, setJuryStep] = useState<JuryStep>('step_2');
  const [juryLoading, setJuryLoading] = useState(false);
  const [juryError, setJuryError] = useState('');

  useEffect(() => () => {
    if (after?.objectUrl) URL.revokeObjectURL(after.url);
  }, [after]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timer = window.setTimeout(() => {
      setPhase('planning');
      setActivity((items) => ['42 yapı analiz edildi; 8 kritik hedef belirlendi.', ...items].slice(0, 6));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'planning') return;
    const timer = window.setTimeout(() => {
      setPhase('live');
      setAcknowledgedIds([1, 2, 3, 4, 5, 6, 7]);
      setPlanChange('v1 · 36 personel için ilk görev ve rota paketi oluşturuldu.');
      setActivity((items) => ['36 personel için rol, ekipman, araç ve mesafe puanlı görev paketleri oluşturuldu.', ...items].slice(0, 6));
    }, 850);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'live' || paused || progress >= 100) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 2)), 650);
    return () => window.clearInterval(timer);
  }, [phase, paused, progress]);

  const routePlans = useMemo(() => buildRoutePlans(criticalCount, closureCount, helpRequests), [criticalCount, closureCount, helpRequests]);
  const movingPeople = useMemo(() => routePlans.map((plan, index) => {
    const personalProgress = phase === 'live' ? Math.min(100, progress + (index % 6) * 4) : 0;
    const position = pointAlongPath(plan.path, personalProgress / 100);
    return {
      ...plan,
      x: position.x,
      y: position.y,
      status: personStatus(progress, phase, index, acknowledgedIds.includes(plan.person.id), helpRequests.some((request) => request.requesterId === plan.person.id)),
    };
  }), [acknowledgedIds, helpRequests, phase, progress, routePlans]);

  const selectedPerson = movingPeople.find((person) => person.person.id === selectedPersonId) ?? movingPeople[0];
  const taskCount = 9 + Math.max(0, criticalCount - 8) + helpRequests.length;
  const acceptedTasks = phase === 'live' ? Math.min(taskCount, 7 + Math.floor(progress / 28) + helpRequests.length) : 0;
  const completedTasks = phase === 'live' ? Math.min(taskCount, Math.floor(progress / 12)) : 0;
  const enRoutePersonnel = movingPeople.filter((person) => person.status === 'Yola Çıktı').length;
  const resourcePackages = movingPeople.filter((person) => !['Müsait', 'Görev Atandı'].includes(person.status)).length;
  const averageEta = Math.max(1, Math.round(movingPeople.reduce((sum, plan) => sum + Math.max(1, plan.person.eta * (1 - progress / 100)), 0) / movingPeople.length));
  const activeCriticalIndices = CRITICAL_BUILDING_INDICES.slice(0, criticalCount);
  const visibleRoutes = routePlans.filter((plan, index) => index < 10 || plan.person.id === selectedPersonId);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFileMessage('Yalnızca JPG, PNG veya WEBP görüntüsü seçin.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileMessage('Görüntü 10 MB sınırını aşmamalıdır.');
      return;
    }
    setAfter({ url: URL.createObjectURL(file), name: file.name, objectUrl: true });
    setFileMessage('Görüntü hazır. Konum ve otomatik referans adımı demonstrasyonda simüle edilecektir.');
    resetScenario(false);
  }

  function loadExample() {
    setAfter({ url: '/media/afet-sonrasi-analiz.webp', name: 'örnek-afet-sonrası.webp', objectUrl: false });
    setFileMessage('Örnek afet sonrası görüntüsü yüklendi.');
    resetScenario(false);
  }

  async function loadJurySimulation() {
    setJuryLoading(true);
    setJuryError('');
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    const endpoint = apiBase ? `${apiBase}/jury/simulation` : JURY_FIXTURE_URL;
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Jüri simülasyonu alınamadı (${response.status}).`);
      setJuryResult(await response.json() as JurySimulationResult);
    } catch (error) {
      setJuryResult(null);
      setJuryError(error instanceof Error ? error.message : 'Jüri simülasyonu alınamadı.');
    } finally {
      setJuryLoading(false);
    }
  }

  function startAnalysis() {
    if (!after) loadExample();
    setPhase('analyzing');
    setProgress(0);
    setPaused(false);
    setRevision(1);
    setClosureCount(1);
    setCriticalCount(8);
    setRouteUpdates(0);
    setAcknowledgedIds([]);
    setHelpRequests([]);
    setPlanChange('v1 · Görüntü analizi ve ilk atamalar hazırlanıyor.');
    setActivity(['Afet sonrası görüntü alındı; analiz başlatıldı.']);
    void loadJurySimulation();
  }

  function addClosure() {
    if (phase !== 'live' || closureCount >= CLOSURES.length) return;
    const nextClosureCount = closureCount + 1;
    const nextPlans = buildRoutePlans(criticalCount, nextClosureCount, helpRequests);
    const changed = countPlanChanges(routePlans, nextPlans);
    const nextRevision = revision + 1;
    setClosureCount(nextClosureCount);
    setRevision(nextRevision);
    setRouteUpdates((value) => value + changed);
    setProgress((value) => Math.max(10, value - 8));
    setPlanChange(`v${nextRevision} · ${CLOSURES[nextClosureCount - 1].label}; ${changed} güzergâh gerçekten değişti.`);
    setActivity((items) => [`${CLOSURES[nextClosureCount - 1].label}; ${changed} personelin ana güzergâhı yeniden hesaplandı.`, ...items].slice(0, 6));
  }

  function addCriticalTarget() {
    if (phase !== 'live' || criticalCount >= TARGETS.length) return;
    const nextCriticalCount = criticalCount + 1;
    const nextPlans = buildRoutePlans(nextCriticalCount, closureCount, helpRequests);
    const changed = countPlanChanges(routePlans, nextPlans);
    const nextRevision = revision + 1;
    const newTarget = TARGETS[nextCriticalCount - 1];
    setCriticalCount(nextCriticalCount);
    setRevision(nextRevision);
    setRouteUpdates((value) => value + changed);
    setPlanChange(`v${nextRevision} · ${newTarget.name} kritik hedef oldu; ${changed} görev veya rota güncellendi.`);
    setActivity((items) => [`${newTarget.name} için yeni kritik hasar bildirimi alındı; plan yeniden optimize edildi.`, ...items].slice(0, 6));
  }

  function acknowledgeMission() {
    if (phase !== 'live' || !selectedPerson || acknowledgedIds.includes(selectedPerson.person.id)) return;
    setAcknowledgedIds((ids) => [...ids, selectedPerson.person.id]);
    setActivity((items) => [`${selectedPerson.person.name}, ${selectedPerson.person.device} üzerinden görevi kabul etti.`, ...items].slice(0, 6));
  }

  function requestHelp() {
    if (phase !== 'live' || !selectedPerson || helpRequests.some((request) => request.requesterId === selectedPerson.person.id)) return;
    const nextHelpRequests = [...helpRequests, { requesterId: selectedPerson.person.id, targetId: selectedPerson.target.id }];
    const nextPlans = buildRoutePlans(criticalCount, closureCount, nextHelpRequests);
    const changed = countPlanChanges(routePlans, nextPlans);
    const nextRevision = revision + 1;
    setHelpRequests(nextHelpRequests);
    setRevision(nextRevision);
    setRouteUpdates((value) => value + changed);
    setPlanChange(`v${nextRevision} · Yardım talebi için ${changed} destek görevi veya rota güncellendi.`);
    setActivity((items) => [`${selectedPerson.person.name} yardım istedi; en uygun destek personeli ${selectedPerson.target.name} hedefine yönlendirildi.`, ...items].slice(0, 6));
  }

  function resetScenario(clearImage = false) {
    setPhase('idle');
    setProgress(0);
    setPaused(false);
    setRevision(1);
    setClosureCount(1);
    setCriticalCount(8);
    setRouteUpdates(0);
    setAcknowledgedIds([]);
    setHelpRequests([]);
    setPlanChange('v1 · Başlangıç planı hazırlanmayı bekliyor.');
    setActivity(['Operasyon senaryosu analize hazır.']);
    if (clearImage) {
      setAfter(null);
      setFileMessage('');
    }
  }

  return (
    <div className="system-workspace">
      <div className="system-notice"><AlertTriangle aria-hidden="true" /><p><b>İnteraktif web demonstrasyonu.</b> Görüntü analizi, görev dağıtımı ve rotalar sentetik senaryo verisiyle çalışır; gerçek afet kararı veya resmî erken uyarı üretmez.</p></div>

      <section className="single-upload-layout" aria-labelledby="upload-title">
        <article className="upload-card single-upload-card">
          <div className="upload-head"><span id="upload-title">Afet sonrası görüntü</span>{after && <small><CheckCircle2 /> Hazır</small>}</div>
          {after ? <div className="upload-preview"><Image src={after.url} alt="Afet sonrası analiz görüntüsü" fill unoptimized={after.objectUrl} sizes="(max-width: 850px) 92vw, 58vw" /><span>{after.name}</span></div> : <div className="upload-empty"><FileImage /><b>Tek görüntü yeterli</b><p>Güncel uydu, İHA veya hava görüntüsünü seçin.</p></div>}
          <label className="upload-button"><Upload /> Görüntü seç<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectFile} /></label>
          {fileMessage && <output className="upload-message">{fileMessage}</output>}
        </article>

        <aside className="reference-panel">
          <div><Satellite aria-hidden="true" /><span><b>Otomatik referans adımı</b><small>Manuel “afet öncesi” yüklemesi kaldırıldı</small></span></div>
          <ol>
            <li className={after ? 'done' : ''}><span>01</span> Güncel görüntüyü ve konum bilgisini al</li>
            <li className={phase !== 'idle' ? 'done' : ''}><span>02</span> Uygun geçmiş referansını arka planda eşleştir</li>
            <li className={phase === 'planning' || phase === 'live' ? 'done' : ''}><span>03</span> Hasar ve operasyon ihtiyacını hesapla</li>
          </ol>
          <p><WifiOff aria-hidden="true" /> Gerçek referans görüntüsü servisi henüz bağlı değildir; bu adım demonstrasyonda açıkça simüle edilir.</p>
        </aside>
      </section>

      <div className="dashboard-actions">
        <button type="button" onClick={loadExample}>Örnek görüntüyü kullan</button>
        <button className="run-button" type="button" onClick={startAnalysis} disabled={phase === 'analyzing' || phase === 'planning'}>{phase === 'analyzing' || phase === 'planning' ? <><LoaderCircle className="spin" /> Operasyon hazırlanıyor…</> : 'Analizi ve operasyonu başlat'}</button>
      </div>

      {phase !== 'idle' && selectedPerson && (
        <section className="operation-console" aria-live="polite">
          <header className="operation-console-head">
            <div><span className={`live-indicator ${phase === 'live' ? 'ready' : ''}`}><Radio aria-hidden="true" /> {phase === 'live' ? 'Canlı simülasyon' : phase === 'planning' ? 'Görev planlanıyor' : 'Görüntü analiz ediliyor'}</span><h2>Afet operasyon paneli</h2></div>
            <span>Görev Planı v{revision}</span>
          </header>
          <p className="plan-change-note"><RefreshCw aria-hidden="true" /> {planChange}</p>

          <section className="jury-panel" aria-label="Jüri simülasyonu sonucu">
            <div className="jury-panel-head">
              <div><span className="mission-kicker"><Satellite aria-hidden="true" /> Jüri simülasyonu</span><small>{juryResult ? `Şema ${juryResult.simulation_schema_version} · ${juryResult.incident_id}` : 'Backend sözleşmesi bekleniyor'}</small></div>
              {juryResult && <div className="jury-tabs" role="tablist" aria-label="Jüri simülasyonu adımları">
                <button type="button" className={juryStep === 'step_2' ? 'active' : ''} onClick={() => setJuryStep('step_2')} role="tab" aria-selected={juryStep === 'step_2'}>Adım 2 · Analiz</button>
                <button type="button" className={juryStep === 'step_7' ? 'active' : ''} onClick={() => setJuryStep('step_7')} role="tab" aria-selected={juryStep === 'step_7'}>Adım 7 · Yeniden rota</button>
              </div>}
            </div>
            {juryLoading && <p className="jury-state">Jüri simülasyonu yükleniyor...</p>}
            {!juryLoading && juryError && <p className="jury-state error">{juryError}</p>}
            {!juryLoading && !juryError && juryResult && juryStep === 'step_2' && <div className="jury-step-grid">
              <article><strong>{juryResult.step_2.solution_time_ms.toFixed(2)} ms</strong><span>çözüm süresi</span></article>
              <article><strong>{juryResult.step_2.osm_source}</strong><span>OSM kaynağı</span></article>
              <article><strong>{juryResult.step_2.offline_ready ? 'Hazır' : 'Hazır değil'}</strong><span>çevrimdışı çalışma</span></article>
              <p className="jury-summary">{juryResult.step_2.summary}</p>
            </div>}
            {!juryLoading && !juryError && juryResult && juryStep === 'step_7' && <div className="jury-step-content">
              <p className="jury-summary">{juryResult.step_7.replan_summary}</p>
              <div className="jury-plan-grid"><span>Eski plan hash<strong>{juryResult.step_7.old_plan.plan_hash}</strong></span><span>Yeni plan hash<strong>{juryResult.step_7.new_plan.plan_hash}</strong></span><span className="jury-badge">Eski kriptografik imza<strong>{juryResult.step_7.old_plan.signature}</strong></span><span className="jury-badge">Yeni kriptografik imza<strong>{juryResult.step_7.new_plan.signature}</strong></span><span>Yeniden rota sürümü<strong>{juryResult.step_7.replan_version}</strong></span><span>Ulaşılamayan bina<strong>{juryResult.step_7.unreachable_buildings.length}</strong></span></div>
              <div className="jury-teams">{juryResult.step_7.rerouted_teams.map((team) => <article key={team.team_name}><strong>{team.team_name}</strong><span>Rota değişti · {team.new_order.length} bina · Ulaşılamayan {team.unreachable_buildings.length}</span></article>)}</div>
            </div>}
          </section>

          <div className="operation-layout">
            <div className="operation-map" aria-label="Sanal afet bölgesi, yol ağı, personel ve yeniden hesaplanan rotalar">
              <div className="map-grid" aria-hidden="true" />
              <svg className="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline className="alternative-route" points={selectedPerson.alternative.map((point) => `${point.x},${point.y}`).join(' ')} />
                {visibleRoutes.map((plan) => <polyline className={plan.person.id === selectedPersonId ? 'selected-route' : ''} key={plan.person.id} points={plan.path.map((point) => `${point.x},${point.y}`).join(' ')} />)}
              </svg>
              {BUILDINGS.map((building, index) => <span key={building.id} className={`sim-building ${activeCriticalIndices.includes(index) ? 'critical' : building.severity}`} style={{ left: `${building.x}%`, top: `${building.y}%` }} title={`${building.id} — ${activeCriticalIndices.includes(index) ? 'kritik hedef' : 'analiz edildi'}`} />)}
              {CLOSURES.slice(0, closureCount).map((closure) => <span key={closure.label} className="road-closure" style={{ left: `${GRID_X[closure.col]}%`, top: `${GRID_Y[closure.row]}%` }} title={closure.label}>×</span>)}
              {movingPeople.map((plan) => <button key={plan.person.id} type="button" className={`person-marker ${plan.person.id === selectedPersonId ? 'selected' : ''} ${plan.isSupport ? 'support' : ''}`} style={{ left: `${plan.x}%`, top: `${plan.y}%` }} onClick={() => setSelectedPersonId(plan.person.id)} aria-label={`${plan.person.name}, ${plan.status}`} title={`${plan.person.name} — ${plan.status}`}><span>{plan.person.id}</span></button>)}
              <div className="map-legend"><span><i className="legend-person" /> Personel</span><span><i className="legend-critical" /> Kritik yapı</span><span><i className="legend-closure" /> Kapalı yol</span><span><i className="legend-alternative" /> Alternatif rota</span></div>
            </div>

            <aside className="mission-panel">
              <p className="mission-kicker"><UserRoundCheck aria-hidden="true" /> Kişiye özel görev paketi</p>
              <h3>{selectedPerson.person.name}</h3>
              <dl>
                <div><dt>Durum</dt><dd>{selectedPerson.status}</dd></div>
                <div><dt>Ekip / cihaz</dt><dd>{selectedPerson.person.team} · {selectedPerson.person.device}</dd></div>
                <div><dt>Rol ve yetkinlik</dt><dd>{selectedPerson.person.role} · {selectedPerson.person.skills}</dd></div>
                <div><dt>Hedef / öncelik</dt><dd>{selectedPerson.target.name} · P{selectedPerson.target.priority} · {selectedPerson.target.entry}</dd></div>
                <div><dt>Eşleşme puanı</dt><dd>{selectedPerson.score} / 100 · kapasite {selectedPerson.target.capacity}</dd></div>
                <div><dt>Araç / ekipman</dt><dd>{selectedPerson.person.vehicle} · {selectedPerson.person.equipment}</dd></div>
                <div><dt>Ana rota</dt><dd>{routeLabel(selectedPerson.path, selectedPerson.target.entry)}</dd></div>
                <div><dt>Alternatif rota</dt><dd>{routeLabel(selectedPerson.alternative, selectedPerson.target.entry)}</dd></div>
                <div><dt>Risk / tahmini intikal</dt><dd>{selectedPerson.target.risk} · {Math.max(1, Math.round(selectedPerson.person.eta * (1 - progress / 100)))} dakika</dd></div>
              </dl>
              <p className="mission-warning"><ShieldCheck aria-hidden="true" /> Kapalı düğümler ana ve alternatif rota hesaplarından çıkarılır; plan değişikliği yeni sürüm olarak kayda geçer.</p>
              <div className="device-actions">
                <button type="button" onClick={acknowledgeMission} disabled={phase !== 'live' || selectedPerson.status !== 'Görev Atandı'}><CheckCircle2 aria-hidden="true" /> Görevi aldım</button>
                <button type="button" onClick={requestHelp} disabled={phase !== 'live' || selectedPerson.status === 'Yardım Gerekiyor'}><LifeBuoy aria-hidden="true" /> Yardım istiyorum</button>
              </div>
            </aside>
          </div>

          <div className="simulation-controls">
            <button type="button" onClick={() => setPaused((value) => !value)} disabled={phase !== 'live'}>{paused ? <><Play aria-hidden="true" /> Devam ettir</> : <><Pause aria-hidden="true" /> Duraklat</>}</button>
            <button type="button" onClick={addClosure} disabled={phase !== 'live' || closureCount >= CLOSURES.length}><Route aria-hidden="true" /> Yeni yol kapanması</button>
            <button type="button" onClick={addCriticalTarget} disabled={phase !== 'live' || criticalCount >= TARGETS.length}><Siren aria-hidden="true" /> Yeni kritik hasar</button>
            <button type="button" onClick={() => resetScenario(false)}><RefreshCw aria-hidden="true" /> Senaryoyu sıfırla</button>
          </div>

          <div className="operation-bottom-grid">
            <section className="activity-feed"><h3><MapPinned aria-hidden="true" /> Operasyon akışı</h3>{activity.map((item, index) => <p key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{item}</p>)}</section>
            <section className="operation-summary"><div><strong>{completedTasks}</strong><span>tamamlanan görev</span></div><div><strong>{enRoutePersonnel}</strong><span>yoldaki personel</span></div><div><strong>{Math.max(0, taskCount - completedTasks)}</strong><span>aktif operasyon</span></div><div><strong>{routeUpdates}</strong><span>güncellenen rota</span></div><div><strong>{resourcePackages}</strong><span>aktif kaynak paketi</span></div><div><strong>{Math.round(progress)}%</strong><span>senaryo ilerlemesi</span></div></section>
          </div>
        </section>
      )}
    </div>
  );
}
