CREATE TABLE IF NOT EXISTS "pr_review_context_cache" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"data" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
