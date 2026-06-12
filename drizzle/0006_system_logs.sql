CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "system_logs_source_created_at_idx" ON "system_logs" USING btree ("source","created_at");
--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");
