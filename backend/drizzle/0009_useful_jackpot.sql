CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_login` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	FOREIGN KEY (`recipient_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notif_recipient_read_idx` ON `notifications` (`recipient_login`,`is_read`);--> statement-breakpoint
CREATE TABLE `picto_request_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`author_login` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`request_id`) REFERENCES `picto_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prc_request_id_idx` ON `picto_request_comments` (`request_id`);--> statement-breakpoint
CREATE TABLE `picto_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_login` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`reference_image_key` text,
	`urgency` text DEFAULT 'normale' NOT NULL,
	`status` text DEFAULT 'nouvelle' NOT NULL,
	`assigned_to` text,
	`delivered_pictogram_id` text,
	`rejection_reason` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`requester_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delivered_pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pr_requester_login_idx` ON `picto_requests` (`requester_login`);--> statement-breakpoint
CREATE INDEX `pr_status_idx` ON `picto_requests` (`status`);