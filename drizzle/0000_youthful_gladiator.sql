CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`organization` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contact_messages_created_at` ON `contact_messages` (`created_at`);