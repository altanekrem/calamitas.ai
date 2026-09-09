import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  organization: text('organization'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  deleteTokenHash: text('delete_token_hash').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_contact_messages_created_at').on(table.createdAt)]);
