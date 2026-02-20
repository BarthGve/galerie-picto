CREATE TABLE `user_pictograms` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_login` text NOT NULL,
	`name` text NOT NULL,
	`filename` text NOT NULL,
	`minio_key` text NOT NULL,
	`size` integer NOT NULL,
	`tags` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_login`) REFERENCES `users`(`github_login`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_collection_user_pictograms` (
	`collection_id` text NOT NULL,
	`user_pictogram_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` text,
	PRIMARY KEY(`collection_id`, `user_pictogram_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `user_collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_pictogram_id`) REFERENCES `user_pictograms`(`id`) ON UPDATE no action ON DELETE cascade
);
