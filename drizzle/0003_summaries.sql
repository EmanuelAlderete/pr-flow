CREATE TYPE "public"."summary_type" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "summary_type" NOT NULL,
	"period_key" text NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "summaries_type_period_key_unique" ON "summaries" USING btree ("type","period_key");
