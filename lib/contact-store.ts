import { env } from 'cloudflare:workers';
import { flushPendingSheetRows } from '@/lib/google-sheets-sync';

const SPONSOR_SHEET_ID = '1OdILim7PzmtZSHK1CJHj9dueujT0RmVeOWPx0VEoTCY';

type ContactInput = {
  name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  sponsorshipType: string;
  budget: string;
  subject: string;
  message: string;
};

export async function saveContactMessage(input: ContactInput) {
  if (!env.DB) throw new Error('Mesaj veritabanı bağlantısı kullanılamıyor.');
  const id = crypto.randomUUID();
  const deleteToken = crypto.randomUUID();
  const deleteTokenHash = await hashToken(deleteToken);
  const createdAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO contact_messages (
    id, name, email, organization, subject, message, phone, sponsorship_type, budget,
    consent_at, email_status, sheet_status, delete_token_hash, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      input.name,
      input.email,
      input.organization,
      input.subject,
      input.message,
      input.phone ?? '',
      input.sponsorshipType,
      input.budget,
      createdAt,
      'not_configured',
      'queued',
      deleteTokenHash,
      createdAt,
    )
    .run();
  return { id, deleteToken, createdAt };
}

export async function isContactRateLimited(email: string) {
  if (!env.DB) throw new Error('Mesaj veritabanı bağlantısı kullanılamıyor.');
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const result = await env.DB.prepare('SELECT COUNT(*) AS count FROM contact_messages WHERE email = ? AND created_at >= ?')
    .bind(email, since)
    .first<{ count: number }>();
  return Number(result?.count ?? 0) >= 3;
}

export async function updateContactDeliveryStatus(id: string, emailStatus: string, sheetStatus: string) {
  if (!env.DB) throw new Error('Mesaj veritabanı bağlantısı kullanılamıyor.');
  await env.DB.prepare('UPDATE contact_messages SET email_status = ?, sheet_status = ? WHERE id = ?')
    .bind(emailStatus, sheetStatus, id)
    .run();
}

async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function deleteContactMessage(id: string, deleteToken: string) {
  if (!env.DB) throw new Error('Mesaj veritabanı bağlantısı kullanılamıyor.');
  const deleteTokenHash = await hashToken(deleteToken);
  const existing = await env.DB.prepare('SELECT id, sheet_status FROM contact_messages WHERE id = ? AND delete_token_hash = ?')
    .bind(id, deleteTokenHash)
    .first<{ id: string; sheet_status: string }>();
  if (!existing) return false;
  const syncedQueue = await env.DB.prepare(`SELECT id FROM sheet_sync_queue
    WHERE operation = 'append' AND (record_id = ? OR (record_id = '' AND json_extract(row_json, '$[0]') = ?)) AND synced_at IS NOT NULL LIMIT 1`)
    .bind(id, id)
    .first<{ id: string }>();
  const deletionNeeded = existing.sheet_status === 'synced' || Boolean(syncedQueue);
  const batch = [];
  if (deletionNeeded) {
    batch.push(env.DB.prepare(`INSERT INTO sheet_sync_queue (
      id, operation, record_id, spreadsheet_id, sheet_name, headers_json, row_json, created_at, synced_at, attempt_count, last_error
    ) VALUES (?, 'delete', ?, ?, 'Sponsor Formu', '[]', ?, ?, NULL, 0, NULL)`)
      .bind(crypto.randomUUID(), id, SPONSOR_SHEET_ID, JSON.stringify([id]), new Date().toISOString()));
  }
  batch.push(
    env.DB.prepare(`DELETE FROM sheet_sync_queue
      WHERE operation = 'append' AND (record_id = ? OR (record_id = '' AND json_extract(row_json, '$[0]') = ?))`).bind(id, id),
    env.DB.prepare('DELETE FROM contact_messages WHERE id = ? AND delete_token_hash = ?').bind(id, deleteTokenHash),
  );
  await env.DB.batch(batch);
  if (deletionNeeded) await flushPendingSheetRows(20);
  return true;
}
