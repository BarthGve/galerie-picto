CREATE TABLE `gdpr_request_history` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_login` text NOT NULL,
	`action` text NOT NULL,
	`from_status` text,
	`to_status` text,
	`detail` text,
	`created_at` text,
	FOREIGN KEY (`request_id`) REFERENCES `gdpr_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gdrh_request_id_idx` ON `gdpr_request_history` (`request_id`);