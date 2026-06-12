CREATE TABLE IF NOT EXISTS "pr_slack_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_url" text NOT NULL,
	"pr_id" text,
	"channel" text NOT NULL,
	"thread_ts" text NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pr_slack_shares_pr_url_unique" ON "pr_slack_shares" USING btree ("pr_url");
