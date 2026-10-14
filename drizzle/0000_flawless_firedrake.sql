CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` text,
	`completed_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`notebook_day` text NOT NULL,
	`body` text NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_notebook_day_active_unique` ON `notes` (`notebook_day`) WHERE "notes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`github_login` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`period_key` text NOT NULL,
	`content` text NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `summaries_type_period_key_unique` ON `summaries` (`type`,`period_key`);--> statement-breakpoint
CREATE TABLE `jira_issue_details` (
	`issue_key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jira_issues_cache` (
	`sprint_filter` text PRIMARY KEY NOT NULL,
	`issues` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jira_sprints_cache` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`payload` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jira_sync_meta` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`display_name` text,
	`last_synced_at` integer,
	`last_sync_status` text,
	`last_sync_error` text
);
--> statement-breakpoint
CREATE TABLE `monitored_repositories` (
	`id` text PRIMARY KEY NOT NULL,
	`repository` text NOT NULL,
	`default_branch` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monitored_repositories_repository_unique` ON `monitored_repositories` (`repository`);--> statement-breakpoint
CREATE TABLE `open_pr_branch_bases` (
	`id` text PRIMARY KEY NOT NULL,
	`repository` text NOT NULL,
	`branch_name` text NOT NULL,
	`base_branch` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `open_pr_branch_bases_repository_branch_unique` ON `open_pr_branch_bases` (`repository`,`branch_name`);--> statement-breakpoint
CREATE TABLE `pr_local_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`repository` text NOT NULL,
	`pr_number` integer NOT NULL,
	`pr_id` text NOT NULL,
	`head_sha` text NOT NULL,
	`base_ref` text NOT NULL,
	`status` text NOT NULL,
	`model` text NOT NULL,
	`summary` text,
	`report` text,
	`error` text,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pr_local_reviews_repo_pr_sha_unique` ON `pr_local_reviews` (`repository`,`pr_number`,`head_sha`);--> statement-breakpoint
CREATE TABLE `pr_monitor_cache` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`data` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pr_review_context_cache` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`data` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pr_reviewer_queue_cache` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`data` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pr_slack_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`pr_url` text NOT NULL,
	`pr_id` text,
	`channel` text NOT NULL,
	`thread_ts` text NOT NULL,
	`shared_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pr_slack_shares_pr_url_unique` ON `pr_slack_shares` (`pr_url`);--> statement-breakpoint
CREATE TABLE `pr_sync_meta` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`github_login` text,
	`last_synced_at` integer,
	`last_sync_status` text,
	`last_sync_error` text
);
--> statement-breakpoint
CREATE TABLE `pr_timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`github_login` text NOT NULL,
	`notebook_day` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`event_type` text NOT NULL,
	`pr_id` text NOT NULL,
	`pr_number` integer NOT NULL,
	`pr_title` text NOT NULL,
	`repository` text NOT NULL,
	`jira_issue_key` text,
	`payload` text NOT NULL,
	`dedupe_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pr_timeline_events_dedupe_key_unique` ON `pr_timeline_events` (`dedupe_key`);