CREATE TABLE `standup_scripts` (
	`id` text PRIMARY KEY NOT NULL,
	`notebook_day` text NOT NULL,
	`content` text NOT NULL,
	`status` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `standup_scripts_notebook_day_unique` ON `standup_scripts` (`notebook_day`);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`notebook_day` text NOT NULL,
	`kind` text NOT NULL,
	`beat` text,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` integer NOT NULL
);
