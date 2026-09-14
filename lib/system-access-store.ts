import { env } from 'cloudflare:workers';
import { queueSheetRow } from '@/lib/google-sheets-sync';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const LOGIN_SHEET_ID = '1HgggrqGbE2hITD3Tvcw-tRfFZ4zIk0qw7c5glRqE1VM';
const FALLBACK_SESSION_SECRET = '626c020103248dc0d1118f00967e59933b94f1677b146b08d56a8849a972c7b0';

export function formatIstanbulParts(date: Date) {
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${value('day')}.${value('month')}.${value('year')}`,
    day: value('weekday'),
    time: `${value('hour')}:${value('minute')}:${value('second')}`,
  };
}

export function detectDevice(userAgent: string) {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return 'Tablet';
  if (/mobi|android|iphone|ipod/i.test(userAgent)) return 'Mobil';
  return 'Masaüstü';
}

export async function isLoginRateLimited(username: string, userAgent: string) {
  if (!env.DB) return false;
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const result = await env.DB.prepare(`SELECT COUNT(*) AS count FROM system_login_attempts
    WHERE succeeded = 0 AND username = ? AND user_agent = ? AND attempted_at >= ?`)
    .bind(username || 'Belirtilmedi', userAgent.slice(0, 500), since)
    .first<{ count: number }>();
  return Number(result?.count ?? 0) >= 8;
}

export async function recordLoginAttempt(input: {
  visitorName: string;
  username: string;
  succeeded: boolean;
  outcome: string;
  userAgent: string;
}) {
  const id = crypto.randomUUID();
  const attemptedAt = new Date();
  const local = formatIstanbulParts(attemptedAt);
  const device = detectDevice(input.userAgent);
  if (!env.DB) return { id, sheetAccepted: false };
  await env.DB.prepare(`INSERT INTO system_login_attempts (
    id, visitor_name, username, succeeded, outcome, attempted_at, local_date, local_day, local_time, device, user_agent
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      input.visitorName,
      input.username,
      input.succeeded ? 1 : 0,
      input.outcome,
      attemptedAt.toISOString(),
      local.date,
      local.day,
      local.time,
      device,
      input.userAgent.slice(0, 500),
    )
    .run();
  let sheetAccepted = false;
  try {
    const queued = await queueSheetRow({
      spreadsheetId: LOGIN_SHEET_ID,
      sheetName: 'Giriş Kayıtları',
      headers: ['Kayıt No', 'Tarih', 'Gün', 'Saat', 'Ziyaretçi Adı', 'Kullanıcı Adı', 'Durum', 'Cihaz'],
      row: [id, local.date, local.day, local.time, input.visitorName, input.username, input.outcome, device],
    });
    sheetAccepted = queued.accepted;
  } catch {
    sheetAccepted = false;
  }
  return { id, sheetAccepted };
}

export async function createAccessSession(visitorName: string) {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);
  if (!env.DB) {
    const payload = `${encodeTokenPart(visitorName)}.${expiresAt.getTime()}`;
    const signature = await hashToken(`${FALLBACK_SESSION_SECRET}.${payload}`);
    return { token: `${payload}.${signature}`, maxAge: Math.floor(SESSION_DURATION_MS / 1000) };
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM system_access_sessions WHERE expires_at <= ?').bind(createdAt.toISOString()),
    env.DB.prepare('INSERT INTO system_access_sessions (token_hash, visitor_name, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(tokenHash, visitorName, createdAt.toISOString(), expiresAt.toISOString()),
  ]);
  return { token, maxAge: Math.floor(SESSION_DURATION_MS / 1000) };
}

export async function validateAccessSession(token: string) {
  if (!token) return null;
  if (!env.DB) {
    const [visitorPart, expiresPart, signature] = token.split('.');
    if (!visitorPart || !expiresPart || !signature) return null;
    const payload = `${visitorPart}.${expiresPart}`;
    const expected = await hashToken(`${FALLBACK_SESSION_SECRET}.${payload}`);
    if (signature !== expected || Number(expiresPart) <= Date.now()) return null;
    return { visitorName: decodeTokenPart(visitorPart) };
  }
  const tokenHash = await hashToken(token);
  const session = await env.DB.prepare('SELECT visitor_name, expires_at FROM system_access_sessions WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ visitor_name: string; expires_at: string }>();
  if (!session || Date.parse(session.expires_at) <= Date.now()) return null;
  return { visitorName: session.visitor_name };
}

export async function deleteAccessSession(token: string) {
  if (!env.DB || !token) return;
  const tokenHash = await hashToken(token);
  await env.DB.prepare('DELETE FROM system_access_sessions WHERE token_hash = ?').bind(tokenHash).run();
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function encodeTokenPart(value: string) {
  return encodeURIComponent(value).replace(/\./g, '%2E');
}

function decodeTokenPart(value: string) {
  try { return decodeURIComponent(value); } catch { return 'Ziyaretçi'; }
}
