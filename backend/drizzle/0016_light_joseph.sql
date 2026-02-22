ALTER TABLE `users` ADD `notify_email_gdpr` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_email_picto_new` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_email_picto_en_cours` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_email_picto_precision` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_email_picto_livre` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_email_picto_refuse` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email_notifications_enabled`;