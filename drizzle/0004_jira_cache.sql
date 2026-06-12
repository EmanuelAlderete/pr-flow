CREATE TABLE IF NOT EXISTS "jira_sync_meta" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"display_name" text,
	"last_synced_at" timestamp with time zone,
	"last_sync_status" text,
	"last_sync_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jira_sprints_cache" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"payload" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jira_issues_cache" (
	"sprint_filter" text PRIMARY KEY NOT NULL,
	"issues" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jira_issue_details" (
	"issue_key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
