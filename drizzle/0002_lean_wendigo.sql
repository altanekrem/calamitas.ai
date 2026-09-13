CREATE TABLE `sheet_sync_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`spreadsheet_id` text NOT NULL,
	`sheet_name` text NOT NULL,
	`headers_json` text NOT NULL,
	`row_json` text NOT NULL,
	`created_at` text NOT NULL,
	`synced_at` text,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `idx_sheet_sync_queue_synced_at` ON `sheet_sync_queue` (`synced_at`);--> statement-breakpoint
CREATE TABLE `system_access_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`visitor_name` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_system_access_sessions_expires_at` ON `system_access_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `system_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_name` text NOT NULL,
	`username` text NOT NULL,
	`succeeded` integer NOT NULL,
	`outcome` text NOT NULL,
	`attempted_at` text NOT NULL,
	`local_date` text NOT NULL,
	`local_day` text NOT NULL,
	`local_time` text NOT NULL,
	`device` text NOT NULL,
	`user_agent` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_system_login_attempts_attempted_at` ON `system_login_attempts` (`attempted_at`);--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `sponsorship_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `budget` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `consent_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `email_status` text DEFAULT 'not_configured' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `sheet_status` text DEFAULT 'queued' NOT NULL;--> statement-breakpoint
PRAGMA optimize;
