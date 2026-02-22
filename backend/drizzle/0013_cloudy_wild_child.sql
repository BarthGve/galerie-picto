CREATE TABLE `gdpr_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_login` text NOT NULL,
	`right_type` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'nouveau' NOT NULL,
	`consent_contact` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`requester_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gdpr_requester_login_idx` ON `gdpr_requests` (`requester_login`);--> statement-breakpoint
CREATE INDEX `gdpr_status_idx` ON `gdpr_requests` (`status`);