CREATE TABLE `user_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_login` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_collection_pictograms` (
	`collection_id` text NOT NULL,
	`pictogram_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` text,
	PRIMARY KEY(`collection_id`, `pictogram_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `user_collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pictogram_id`) REFERENCES `pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
