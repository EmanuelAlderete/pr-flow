CREATE TABLE IF NOT EXISTS "pr_sync_meta" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"github_login" text,
	"last_synced_at" timestamp with time zone,
	"last_sync_status" text,
	"last_sync_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pr_monitor_cache" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
