CREATE TABLE IF NOT EXISTS "pr_timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_login" text NOT NULL,
	"notebook_day" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"event_type" text NOT NULL,
	"pr_id" text NOT NULL,
	"pr_number" integer NOT NULL,
	"pr_title" text NOT NULL,
	"repository" text NOT NULL,
	"jira_issue_key" text,
	"payload" jsonb NOT NULL,
	"dedupe_key" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pr_timeline_events_dedupe_key_unique" ON "pr_timeline_events" USING btree ("dedupe_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_timeline_events_login_day_idx" ON "pr_timeline_events" USING btree ("github_login","notebook_day");
