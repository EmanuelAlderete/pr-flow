CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"github_login" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
