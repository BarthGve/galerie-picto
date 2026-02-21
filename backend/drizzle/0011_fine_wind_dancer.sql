CREATE INDEX `pr_assigned_to_idx` ON `picto_requests` (`assigned_to`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_picto_request_history` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_login` text NOT NULL,
	`action` text NOT NULL,
	`from_status` text,
	`to_status` text,
	`detail` text,
	`created_at` text,
	FOREIGN KEY (`request_id`) REFERENCES `picto_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_picto_request_history`("id", "request_id", "actor_login", "action", "from_status", "to_status", "detail", "created_at") SELECT "id", "request_id", "actor_login", "action", "from_status", "to_status", "detail", "created_at" FROM `picto_request_history`;--> statement-breakpoint
DROP TABLE `picto_request_history`;--> statement-breakpoint
ALTER TABLE `__new_picto_request_history` RENAME TO `picto_request_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `prh_request_id_idx` ON `picto_request_history` (`request_id`);