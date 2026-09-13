import { env } from 'cloudflare:workers';

type SheetRow = {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  row: Array<string | number | boolean>;
};

type SheetOperation = 'append' | 'delete';

type QueueRecord = {
  id: string;
  operation: SheetOperation;
  record_id: string;
  spreadsheet_id: string;
  sheet_name: string;
  headers_json: string;
  row_json: string;
};

const LOGIN_SHEET_ID = '1HgggrqGbE2hITD3Tvcw-tRfFZ4zIk0qw7c5glRqE1VM';
const SPONSOR_SHEET_ID = '1OdILim7PzmtZSHK1CJHj9dueujT0RmVeOWPx0VEoTCY';

type WebhookConfig = {
  endpoint: string;
  secret: string;
};

function getWebhookConfig(spreadsheetId: string): WebhookConfig | null {
  const legacyEndpoint = env.GOOGLE_SHEETS_WEBHOOK_URL;
  const legacySecret = env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? '';
  if (spreadsheetId === LOGIN_SHEET_ID) {
    const endpoint = env.GOOGLE_LOGIN_SHEETS_WEBHOOK_URL ?? legacyEndpoint;
    if (!endpoint) return null;
    return { endpoint, secret: env.GOOGLE_LOGIN_SHEETS_WEBHOOK_SECRET ?? legacySecret };
  }
  if (spreadsheetId === SPONSOR_SHEET_ID) {
    const endpoint = env.GOOGLE_SPONSOR_SHEETS_WEBHOOK_URL ?? legacyEndpoint;
    if (!endpoint) return null;
    return { endpoint, secret: env.GOOGLE_SPONSOR_SHEETS_WEBHOOK_SECRET ?? legacySecret };
  }
  return null;
}

export async function queueSheetRow(input: SheetRow) {
  if (!env.DB) throw new Error('Google Sheets aktarım kuyruğu kullanılamıyor.');
  const id = crypto.randomUUID();
  const recordId = String(input.row[0] ?? '');
  if (!recordId) throw new Error('Google Sheets kayıt numarası eksik.');
  await env.DB.prepare(`INSERT INTO sheet_sync_queue (
    id, operation, record_id, spreadsheet_id, sheet_name, headers_json, row_json, created_at, synced_at, attempt_count, last_error
  ) VALUES (?, 'append', ?, ?, ?, ?, ?, ?, NULL, 0, NULL)`)
    .bind(id, recordId, input.spreadsheetId, input.sheetName, JSON.stringify(input.headers), JSON.stringify(input.row), new Date().toISOString())
    .run();
  const syncedIds = await flushPendingSheetRows(20);
  const accepted = syncedIds.has(id);
  return { queueId: id, accepted, synced: accepted };
}

export async function flushPendingSheetRows(limit = 20) {
  const syncedIds = new Set<string>();
  if (!env.DB) return syncedIds;
  const configuredSheetIds = [LOGIN_SHEET_ID, SPONSOR_SHEET_ID].filter((spreadsheetId) => getWebhookConfig(spreadsheetId));
  if (configuredSheetIds.length === 0) return syncedIds;
  const placeholders = configuredSheetIds.map(() => '?').join(', ');
  const result = await env.DB.prepare(`SELECT id, operation, record_id, spreadsheet_id, sheet_name, headers_json, row_json
    FROM sheet_sync_queue WHERE synced_at IS NULL AND spreadsheet_id IN (${placeholders}) ORDER BY created_at ASC LIMIT ?`)
    .bind(...configuredSheetIds, limit)
    .all<QueueRecord>();
  for (const record of result.results ?? []) {
    const synced = await sendRow(record);
    if (synced) syncedIds.add(record.id);
  }
  return syncedIds;
}

async function sendRow(record: QueueRecord) {
  const webhook = getWebhookConfig(record.spreadsheet_id);
  if (!webhook || !env.DB) return false;
  try {
    const response = await fetch(webhook.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: webhook.secret,
        operation: record.operation,
        recordId: record.record_id,
        spreadsheetId: record.spreadsheet_id,
        sheetName: record.sheet_name,
        headers: JSON.parse(record.headers_json),
        row: JSON.parse(record.row_json),
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const responseBody = await response.json().catch(() => null) as { ok?: boolean; accepted?: boolean } | null;
    if (!responseBody || responseBody.ok !== true || responseBody.accepted === false) {
      throw new Error('Webhook geçerli bir kabul yanıtı döndürmedi.');
    }
    await env.DB.prepare('UPDATE sheet_sync_queue SET synced_at = ?, attempt_count = attempt_count + 1, last_error = NULL WHERE id = ?')
      .bind(new Date().toISOString(), record.id)
      .run();
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 240) : 'Bilinmeyen aktarım hatası';
    await env.DB.prepare('UPDATE sheet_sync_queue SET attempt_count = attempt_count + 1, last_error = ? WHERE id = ?')
      .bind(reason, record.id)
      .run();
    return false;
  }
}
