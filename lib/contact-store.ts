import { env } from 'cloudflare:workers';

let initialized = false;

async function ensureStore() {
  if (initialized) return;
  if (!env.DB) throw new Error('Mesaj veritabanı bağlantısı kullanılamıyor.');
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      delete_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)'),
  ]);
  await env.DB.prepare('PRAGMA optimize').run();
  initialized = true;
}

export async function saveContactMessage(input: { name: string; email: string; organization: string | null; subject: string; message: string }) {
  await ensureStore();
  const id = crypto.randomUUID();
  const deleteToken = crypto.randomUUID();
  const deleteTokenHash = await hashToken(deleteToken);
  await env.DB.prepare('INSERT INTO contact_messages (id, name, email, organization, subject, message, delete_token_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, input.name, input.email, input.organization, input.subject, input.message, deleteTokenHash, new Date().toISOString())
    .run();
  return { id, deleteToken };
}

async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function deleteContactMessage(id: string, deleteToken: string) {
  await ensureStore();
  const deleteTokenHash = await hashToken(deleteToken);
  const result = await env.DB.prepare('DELETE FROM contact_messages WHERE id = ? AND delete_token_hash = ?').bind(id, deleteTokenHash).run();
  return Number(result.meta.changes ?? 0) > 0;
}
