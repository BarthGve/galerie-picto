CREATE TABLE `pictogram_likes` (
	`user_login` text NOT NULL,
	`pictogram_id` text NOT NULL,
	`created_at` text,
	PRIMARY KEY(`user_login`, `pictogram_id`),
	FOREIGN KEY (`user_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `likes_counts` (
	`pictogram_id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL DEFAULT 0,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
