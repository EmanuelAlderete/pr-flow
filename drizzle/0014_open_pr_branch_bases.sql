CREATE TABLE "open_pr_branch_bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository" text NOT NULL,
	"branch_name" text NOT NULL,
	"base_branch" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "open_pr_branch_bases_repository_branch_unique" ON "open_pr_branch_bases" USING btree ("repository","branch_name");
