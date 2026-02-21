ALTER TABLE `feedback_seen` ADD `dismissed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `dismissed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `notif_recipient_dismissed_idx` ON `notifications` (`recipient_login`,`dismissed`);