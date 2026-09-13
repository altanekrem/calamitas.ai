/**
 * Calamitas AI Google Sheets webhook.
 *
 * @OnlyCurrentDoc
 */

const TARGETS = Object.freeze({
  '1HgggrqGbE2hITD3Tvcw-tRfFZ4zIk0qw7c5glRqE1VM': Object.freeze({
    sheetName: 'Giriş Kayıtları',
    headers: Object.freeze(['Kayıt No', 'Tarih', 'Gün', 'Saat', 'Ziyaretçi Adı', 'Kullanıcı Adı', 'Durum', 'Cihaz']),
  }),
  '1OdILim7PzmtZSHK1CJHj9dueujT0RmVeOWPx0VEoTCY': Object.freeze({
    sheetName: 'Sponsor Formu',
    headers: Object.freeze(['Kayıt No', 'Tarih', 'Saat', 'Ad Soyad', 'E-posta', 'Kurum / Marka', 'Telefon', 'Katkı Alanı', 'Tahmini Katkı Aralığı', 'Mesaj']),
  }),
});

const QUEUE_PREFIX = 'CALAMITAS_QUEUE_';
const MAX_PAYLOAD_BYTES = 8000;
const MAX_QUEUE_ITEMS = 50;
const MAX_CELL_CHARACTERS = 4000;
const MAX_JOBS_PER_RUN = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function doGet() {
  return jsonResponse({ ok: true, service: 'calamitas-sheets-webhook' });
}

function doPost(event) {
  try {
    const raw = String(event && event.postData && event.postData.contents || '');
    if (!raw || Utilities.newBlob(raw).getBytes().length > MAX_PAYLOAD_BYTES) {
      return jsonResponse({ ok: false, error: 'invalid_payload' });
    }
    const payload = JSON.parse(raw);
    const properties = PropertiesService.getScriptProperties();
    const configuredSpreadsheetId = properties.getProperty('CALAMITAS_SPREADSHEET_ID');
    const expectedSecret = properties.getProperty('CALAMITAS_WEBHOOK_SECRET');
    const target = TARGETS[configuredSpreadsheetId];

    if (!expectedSecret || payload.secret !== expectedSecret) return jsonResponse({ ok: false, error: 'unauthorized' });
    if (!target || payload.spreadsheetId !== configuredSpreadsheetId) return jsonResponse({ ok: false, error: 'sheet_not_allowed' });
    if (payload.sheetName !== target.sheetName || !sameArray(payload.headers, target.headers)) {
      return jsonResponse({ ok: false, error: 'schema_mismatch' });
    }
    if (payload.operation !== 'append' && payload.operation !== 'delete') {
      return jsonResponse({ ok: false, error: 'invalid_operation' });
    }

    const recordId = String(payload.recordId || '');
    if (!UUID_PATTERN.test(recordId)) return jsonResponse({ ok: false, error: 'invalid_record_id' });

    let job;
    if (payload.operation === 'append') {
      if (!Array.isArray(payload.row) || payload.row.length !== target.headers.length) {
        return jsonResponse({ ok: false, error: 'invalid_row' });
      }
      if (String(payload.row[0] || '') !== recordId || !payload.row.every(isSafeCell)) {
        return jsonResponse({ ok: false, error: 'invalid_row' });
      }
      job = { operation: 'append', recordId: recordId, row: payload.row.map(sanitizeCell) };
    } else {
      job = { operation: 'delete', recordId: recordId };
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const key = QUEUE_PREFIX + recordId;
      const allProperties = properties.getProperties();
      const queueSize = Object.keys(allProperties).filter(function (name) { return name.indexOf(QUEUE_PREFIX) === 0; }).length;
      if (!allProperties[key] && queueSize >= MAX_QUEUE_ITEMS) return jsonResponse({ ok: false, error: 'queue_full' });
      properties.setProperty(key, JSON.stringify(job));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true, accepted: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'internal_error' });
  }
}

/**
 * Run this function with an installable, minute-based trigger in each bound
 * spreadsheet project. Bound-trigger execution keeps access limited to the
 * current spreadsheet; doPost deliberately performs no spreadsheet operation.
 */
function drainQueue() {
  const properties = PropertiesService.getScriptProperties();
  const configuredSpreadsheetId = properties.getProperty('CALAMITAS_SPREADSHEET_ID');
  const target = TARGETS[configuredSpreadsheetId];
  if (!target) throw new Error('Calamitas hedef tablo ayarı geçersiz.');

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet || spreadsheet.getId() !== configuredSpreadsheetId) {
    throw new Error('Betik doğru Google Sheet dosyasına bağlı değil.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const allProperties = properties.getProperties();
    const queueKeys = Object.keys(allProperties)
      .filter(function (name) { return name.indexOf(QUEUE_PREFIX) === 0; })
      .sort()
      .slice(0, MAX_JOBS_PER_RUN);
    if (queueKeys.length === 0) return;

    const sheet = spreadsheet.getSheetByName(target.sheetName) || spreadsheet.insertSheet(target.sheetName);
    ensureHeaders(sheet, target.headers);
    const completed = [];

    queueKeys.forEach(function (key) {
      const job = JSON.parse(allProperties[key]);
      if (!job || !UUID_PATTERN.test(String(job.recordId || '')) || (job.operation !== 'append' && job.operation !== 'delete')) {
        throw new Error('Kuyrukta geçersiz bir kayıt bulundu.');
      }
      if (job.operation === 'append') {
        if (!Array.isArray(job.row) || job.row.length !== target.headers.length || String(job.row[0] || '') !== job.recordId) {
          throw new Error('Kuyruk satırı hedef şemayla uyuşmuyor.');
        }
        if (findRecordRows(sheet, job.recordId).length === 0) sheet.appendRow(job.row.map(sanitizeCell));
      } else {
        findRecordRows(sheet, job.recordId).reverse().forEach(function (rowNumber) { sheet.deleteRow(rowNumber); });
      }
      completed.push(key);
    });

    SpreadsheetApp.flush();
    completed.forEach(function (key) { properties.deleteProperty(key); });
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }
  const width = Math.max(sheet.getLastColumn(), headers.length);
  const existing = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (!sameArray(existing.slice(0, headers.length), headers) || existing.slice(headers.length).some(function (value) { return value !== ''; })) {
    throw new Error('Hedef sayfanın başlık satırı beklenen şemayla uyuşmuyor.');
  }
}

function findRecordRows(sheet, recordId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const rows = [];
  ids.forEach(function (value, index) {
    if (value[0] === recordId) rows.push(index + 2);
  });
  return rows;
}

function sameArray(value, expected) {
  return Array.isArray(value) && value.length === expected.length && value.every(function (item, index) {
    return item === expected[index];
  });
}

function isSafeCell(value) {
  return (typeof value === 'string' && value.length <= MAX_CELL_CHARACTERS) || typeof value === 'number' || typeof value === 'boolean';
}

function sanitizeCell(value) {
  if (typeof value !== 'string') return value;
  return /^\s*[=+\-@]/.test(value) ? "'" + value : value;
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
