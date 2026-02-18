CREATE TABLE `downloads` (
	`pictogram_id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_login` text NOT NULL,
	`pictogram_id` text NOT NULL,
	`created_at` text,
	PRIMARY KEY(`user_login`, `pictogram_id`),
	FOREIGN KEY (`user_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `galleries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `gallery_pictograms` (
	`gallery_id` text NOT NULL,
	`pictogram_id` text NOT NULL,
	PRIMARY KEY(`gallery_id`, `pictogram_id`),
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pictograms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`filename` text NOT NULL,
	`url` text NOT NULL,
	`size` integer NOT NULL,
	`last_modified` text NOT NULL,
	`tags` text,
	`contributor_username` text,
	`contributor_avatar_url` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`github_login` text PRIMARY KEY NOT NULL,
	`github_name` text,
	`github_avatar_url` text,
	`github_email` text,
	`first_seen_at` text,
	`last_seen_at` text
);
