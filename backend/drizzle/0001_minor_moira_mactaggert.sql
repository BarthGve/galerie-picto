CREATE TABLE `anonymous_downloads` (
	`ip` text NOT NULL,
	`download_date` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`ip`, `download_date`)
);
