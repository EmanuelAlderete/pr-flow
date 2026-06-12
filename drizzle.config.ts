import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./modules/tasks/lib/schema.ts",
    "./modules/journal/lib/schema.ts",
    "./modules/app/lib/schema.ts",
    "./modules/summaries/lib/schema.ts",
    "./modules/jira/lib/schema.ts",
    "./modules/prs/lib/schema.ts"
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://prflow:prflow@localhost:5432/prflow"
  }
});
