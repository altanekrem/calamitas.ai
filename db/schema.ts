import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  organization: text('organization'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  phone: text('phone').notNull().default(''),
  sponsorshipType: text('sponsorship_type').notNull().default(''),
  budget: text('budget').notNull().default(''),
  consentAt: text('consent_at').notNull().default(''),
  emailStatus: text('email_status').notNull().default('not_configured'),
  sheetStatus: text('sheet_status').notNull().default('queued'),
  deleteTokenHash: text('delete_token_hash').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_contact_messages_created_at').on(table.createdAt)]);

export const systemLoginAttempts = sqliteTable('system_login_attempts', {
  id: text('id').primaryKey(),
  visitorName: text('visitor_name').notNull(),
  username: text('username').notNull(),
  succeeded: integer('succeeded', { mode: 'boolean' }).notNull(),
  outcome: text('outcome').notNull(),
  attemptedAt: text('attempted_at').notNull(),
  localDate: text('local_date').notNull(),
  localDay: text('local_day').notNull(),
  localTime: text('local_time').notNull(),
  device: text('device').notNull(),
  userAgent: text('user_agent').notNull(),
}, (table) => [index('idx_system_login_attempts_attempted_at').on(table.attemptedAt)]);

export const systemAccessSessions = sqliteTable('system_access_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  visitorName: text('visitor_name').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
}, (table) => [index('idx_system_access_sessions_expires_at').on(table.expiresAt)]);

export const sheetSyncQueue = sqliteTable('sheet_sync_queue', {
  id: text('id').primaryKey(),
  operation: text('operation').notNull().default('append'),
  recordId: text('record_id').notNull().default(''),
  spreadsheetId: text('spreadsheet_id').notNull(),
  sheetName: text('sheet_name').notNull(),
  headersJson: text('headers_json').notNull(),
  rowJson: text('row_json').notNull(),
  createdAt: text('created_at').notNull(),
  syncedAt: text('synced_at'),
  attemptCount: integer('attempt_count').notNull().default(0),
  lastError: text('last_error'),
}, (table) => [
  index('idx_sheet_sync_queue_synced_at').on(table.syncedAt),
  index('idx_sheet_sync_queue_record_id').on(table.recordId),
]);
