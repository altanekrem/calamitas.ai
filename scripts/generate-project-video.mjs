import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const outputDirectory = path.resolve(projectRoot, 'public', 'media');
const videoPath = path.join(outputDirectory, 'calamitas-project-intro.webm');
const posterPath = path.join(outputDirectory, 'calamitas-project-video-poster.webp');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDirectory = await mkdtemp(path.join(tmpdir(), 'calamitas-video-'));

const page = `<!doctype html>
<html lang="tr"><meta charset="utf-8"><title>Calamitas Video Generator</title>
<style>html,body{margin:0;background:#050c14;overflow:hidden}canvas{display:block}</style>
<canvas id="canvas" width="540" height="960"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const scenes = [
  ['01 / SORUN', 'AFETTEN SONRA', 'Dağınık bilgi, geciken karar ve değişen saha koşulları.'],
  ['02 / GÖRÜNTÜ', 'TEK GÜNCEL KARE', 'Uydu, İHA veya hava görüntüsü sisteme alınır.'],
  ['03 / YAPAY ZEKÂ', 'HASARI OKU', 'Geçmiş referans konumdan bulunur; değişim ve belirsizlik birlikte değerlendirilir.'],
  ['04 / HASAR HARİTASI', 'ÖNCELİĞİ GÖR', 'Şiddet, kapasite, erişim riski ve giriş noktaları haritaya işlenir.'],
  ['05 / MÜDAHALE', 'İHTİYACI BELİRLE', 'Gerekli rol, araç, ekipman ve ekip kapasitesi çıkarılır.'],
  ['06 / KAYNAKLAR', 'KİM, NEREDE, HAZIR MI?', 'Personel, ekip, araç, ekipman ve son yetkili konum tek havuzda eşleşir.'],
  ['07 / EŞLEŞTİRME', 'DOĞRU EKİBİ BUL', 'Rol, yetkinlik, uygunluk, mesafe ve öncelik birlikte puanlanır.'],
  ['08 / ROTALAR', 'ANA + ALTERNATİF', 'Kapalı yollar ve ikincil riskler çıkarılır; kişiye özel güvenli rota hesaplanır.'],
  ['09 / SAHA CİHAZI', 'GÖREVİ CANLI İZLE', 'Kabul, intikal, varış, tamamlama ve yardım durumları merkeze akar.'],
  ['10 / YENİDEN PLANLAMA', 'PLAN v1 → v2', 'Yeni hasar veya kapanmada görevler görünür sürüm değişikliğiyle yeniden optimize edilir.'],
];
const sceneDuration = 1.62;
const totalDuration = scenes.length * sceneDuration;

function ease(value) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3); }
function wrap(text, maxWidth, font, maxLines = 5) {
  ctx.font = font;
  const words = text.split(' '), lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}
function roundedRect(x,y,w,h,r) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
}
function drawNetwork(progress, index) {
  ctx.save();
  ctx.globalAlpha = .22;
  ctx.strokeStyle = index >= 7 ? '#65c7ff' : '#647d98';
  ctx.lineWidth = 2;
  const rows = [300,410,520,630,740], cols = [55,160,270,380,485];
  for (const y of rows) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for (const x of cols) { ctx.beginPath(); ctx.moveTo(x,235); ctx.lineTo(x,800); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (let i=0;i<18;i++) {
    const x = 62 + (i%5)*103, y = 320 + Math.floor(i/5)*108;
    const critical = (i + index) % 6 === 0;
    ctx.fillStyle = critical ? '#ef444b' : '#36536b';
    ctx.fillRect(x-17,y-17,34,34);
    if (critical) { ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x-20,y-20,40,40); }
  }
  const routeProgress = ease(progress);
  ctx.strokeStyle = '#6bc2fa'; ctx.lineWidth = 6; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(55,760); ctx.lineTo(55,630); ctx.lineTo(270,630); ctx.lineTo(270,410); ctx.lineTo(480,410);
  ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(55 + Math.min(1, routeProgress*2)*0, 760 - Math.min(1, routeProgress*2)*130, 10, 0, Math.PI*2); ctx.fill();
  if (index >= 7) {
    ctx.strokeStyle = '#ffc450'; ctx.lineWidth = 4; ctx.setLineDash([12,9]);
    ctx.beginPath(); ctx.moveTo(55,760); ctx.lineTo(160,760); ctx.lineTo(160,520); ctx.lineTo(480,520); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (index === 9) {
    ctx.fillStyle = '#d72f36'; ctx.beginPath(); ctx.arc(270,630,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 24px Arial'; ctx.textAlign='center';ctx.fillText('×',270,638);ctx.textAlign='left';
  }
  ctx.restore();
}
function render(time) {
  const sceneIndex = Math.min(scenes.length - 1, Math.floor(time / sceneDuration));
  const local = (time - sceneIndex * sceneDuration) / sceneDuration;
  const [label,title,body] = scenes[sceneIndex];
  const enter = ease(Math.min(1, local * 3.2));
  const exit = local > .83 ? 1 - ease((local - .83) / .17) : 1;
  const alpha = enter * exit;

  const gradient = ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0,'#07111c'); gradient.addColorStop(.56,'#10253a'); gradient.addColorStop(1,'#1d3450');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#c52d34'; ctx.save(); ctx.translate(W-110,-90); ctx.rotate(.24); ctx.fillRect(0,0,220,H+240); ctx.restore();
  ctx.fillStyle = 'rgba(7,17,28,.83)'; ctx.fillRect(0,0,W,H);
  drawNetwork(local, sceneIndex);

  ctx.fillStyle = '#f6f0df'; roundedRect(34,32,472,84,14);
  ctx.fillStyle = '#101b2a'; ctx.font = '900 28px Arial'; ctx.fillText('CALAMITAS AI',58,72);
  ctx.font = '700 12px Arial'; ctx.fillStyle = '#b72a31'; ctx.fillText('BİR DAKİKA BİR HAYAT',59,94);
  ['#ff1749','#fff000','#ff7714'].forEach((color,i)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(417+i*28,74,8,0,Math.PI*2);ctx.fill();});

  ctx.globalAlpha = alpha;
  const lift = (1-enter)*42;
  ctx.fillStyle = '#ff656a'; ctx.font = '900 16px Arial'; ctx.fillText(label,42,170+lift);
  const titleFont = title.length > 18 ? '900 48px Arial' : '900 60px Arial';
  const titleLines = wrap(title,456,titleFont,3);
  ctx.fillStyle='#fff';ctx.font=titleFont;
  titleLines.forEach((line,i)=>ctx.fillText(line,42,230+lift+i*58));
  const bodyY = 250 + titleLines.length*58;
  ctx.fillStyle='#d3dde7'; ctx.font='600 21px Arial';
  wrap(body,446,'600 21px Arial',5).forEach((line,i)=>ctx.fillText(line,42,bodyY+lift+i*31));
  ctx.globalAlpha = 1;

  const barY = 883;
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(42,barY,456,4);
  ctx.fillStyle='#ff565d';ctx.fillRect(42,barY,456*((sceneIndex+local)/scenes.length),4);
  ctx.font='800 14px Arial';ctx.fillStyle='#9bacbd';ctx.fillText(String(sceneIndex+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0'),42,920);
  ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText('GÖRÜNTÜDEN CANLI OPERASYONA',498,920);ctx.textAlign='left';
}

window.videoResult = null;
async function record() {
  render(.3);
  const poster = canvas.toDataURL('image/png');
  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise(resolve => recorder.onstop = resolve);
  recorder.start(500);
  await new Promise(resolve => {
    let frame = 0;
    const totalFrames = Math.ceil(totalDuration * 30);
    const timer = setInterval(() => {
      render(Math.min(totalDuration-.001, frame / 30));
      frame += 1;
      if (frame >= totalFrames) { clearInterval(timer); resolve(); }
    }, 1000 / 30);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach(track => track.stop());
  const bytes = new Uint8Array(await new Blob(chunks,{type:mimeType}).arrayBuffer());
  let binary='';
  for (let offset=0; offset<bytes.length; offset+=32768) binary += String.fromCharCode(...bytes.subarray(offset,offset+32768));
  window.videoResult = { video: btoa(binary), poster, mimeType, duration: totalDuration };
}
record().catch(error => { window.videoResult = { error: String(error && error.stack || error) }; });
</script></html>`;

const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(page);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const pagePort = server.address().port;

const debugServer = createServer();
await new Promise((resolve) => debugServer.listen(0, '127.0.0.1', resolve));
const debugPort = debugServer.address().port;
await new Promise((resolve) => debugServer.close(resolve));

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDirectory}`,
  `http://127.0.0.1:${pagePort}/`,
], { stdio: 'ignore' });

async function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function debuggerPage() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json());
      const target = pages.find((item) => item.type === 'page' && item.url.includes(String(pagePort)));
      if (target) return target;
    } catch {}
    await delay(250);
  }
  throw new Error('Chrome video generator did not expose a page target.');
}

const target = await debuggerPage();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let messageId = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
};
function command(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await command('Runtime.enable');
let result;
for (let attempt = 0; attempt < 320; attempt += 1) {
  const evaluated = await command('Runtime.evaluate', { expression: 'window.videoResult', returnByValue: true });
  result = evaluated.result?.value;
  if (result) break;
  await delay(250);
}
if (!result) throw new Error('Video generation timed out.');
if (result.error) throw new Error(result.error);

await mkdir(outputDirectory, { recursive: true });
await writeFile(videoPath, Buffer.from(result.video, 'base64'));
const posterBuffer = Buffer.from(result.poster.split(',')[1], 'base64');
await sharp(posterBuffer).webp({ quality: 88, effort: 5 }).toFile(posterPath);

socket.close();
if (chrome.exitCode === null) {
  chrome.kill();
  await Promise.race([once(chrome, 'exit'), delay(2500)]);
}
await new Promise((resolve) => server.close(resolve));
const safeTempRoot = path.resolve(tmpdir());
const safeProfile = path.resolve(profileDirectory);
if (safeProfile.startsWith(`${safeTempRoot}${path.sep}`)) {
  try {
    await rm(safeProfile, { recursive: true, force: true, maxRetries: 6, retryDelay: 250 });
  } catch (error) {
    if (!['EBUSY', 'EPERM'].includes(error?.code)) throw error;
  }
}

console.log(JSON.stringify({ video: videoPath, poster: posterPath, mimeType: result.mimeType, duration: result.duration }));
