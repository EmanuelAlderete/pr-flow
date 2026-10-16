import { defineConfig } from "drizzle-kit";

function sqliteFile() {
  const url = process.env.DATABASE_URL ?? "file:./data/pr-flow.sqlite";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "./data/pr-flow.sqlite";
  }
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

export default defineConfig({
  schema: [
    "./modules/tasks/lib/schema.ts",
    "./modules/journal/lib/schema.ts",
    "./modules/app/lib/schema.ts",
    "./modules/summaries/lib/schema.ts",
    "./modules/jira/lib/schema.ts",
    "./modules/prs/lib/schema.ts",
    "./modules/day-follow-up/lib/schema.ts"
  ],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: sqliteFile()
  }
});
