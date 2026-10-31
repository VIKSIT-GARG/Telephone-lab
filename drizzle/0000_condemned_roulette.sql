CREATE TABLE `review_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`reviewer` text NOT NULL,
	`language` text NOT NULL,
	`case_hash` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `review_owner_idx` ON `review_records` (`owner`);--> statement-breakpoint
CREATE INDEX `review_language_idx` ON `review_records` (`language`);--> statement-breakpoint
CREATE TABLE `usage_buckets` (
	`key` text PRIMARY KEY NOT NULL,
	`used` integer NOT NULL,
	`expires` integer NOT NULL
);
