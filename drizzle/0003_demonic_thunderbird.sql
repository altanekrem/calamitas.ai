ALTER TABLE `sheet_sync_queue` ADD `operation` text DEFAULT 'append' NOT NULL;--> statement-breakpoint
ALTER TABLE `sheet_sync_queue` ADD `record_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_sheet_sync_queue_record_id` ON `sheet_sync_queue` (`record_id`);--> statement-breakpoint
PRAGMA optimize;
