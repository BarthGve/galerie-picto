CREATE TABLE `feedback_seen` (
	`user_login` text NOT NULL,
	`issue_id` integer NOT NULL,
	`seen_at` text,
	PRIMARY KEY(`user_login`, `issue_id`),
	FOREIGN KEY (`user_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ucup_user_pictogram_id_idx` ON `user_collection_user_pictograms` (`user_pictogram_id`);--> statement-breakpoint
CREATE INDEX `up_owner_login_idx` ON `user_pictograms` (`owner_login`);