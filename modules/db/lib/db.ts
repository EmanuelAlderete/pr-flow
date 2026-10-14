import fs from "node:fs";
import path from "node:path";
import { extractTablesRelationalConfig, createTableRelationsHelpers } from "drizzle-orm";
import { BaseSQLiteDatabase, SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { BetterSQLiteSession } from "drizzle-orm/better-sqlite3/session";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { appSettings } from "@/modules/app/lib/schema";
import { notes } from "@/modules/journal/lib/schema";
import {
  jiraIssueDetails,
  jiraIssuesCache,
  jiraSprintsCache,
  jiraSyncMeta
} from "@/modules/jira/lib/schema";
import { prLocalReviews, prTimelineEvents } from "@/modules/prs/lib/schema";
import { summaries } from "@/modules/summaries/lib/schema";
import { tasks } from "@/modules/tasks/lib/schema";
import { openNodeSqlite, type NodeSqliteClient } from "@/modules/db/lib/node-sqlite";

const schema = {
  tasks,
  notes,
  appSettings,
  summaries,
  jiraSyncMeta,
  jiraSprintsCache,
  jiraIssuesCache,
  jiraIssueDetails,
  prTimelineEvents,
  prLocalReviews
};

const POSTGRES_URL_ERROR =
  "DATABASE_URL ainda aponta para PostgreSQL. Rode npm run db:import-postgres e use file:./data/pr-flow.sqlite.";

let client: NodeSqliteClient | null = null;
let database: ReturnType<typeof createDatabase> | null = null;
let migrated = false;

export function resolveSqliteFile(databaseUrl: string, cwd = process.cwd()): string {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    throw new Error(POSTGRES_URL_ERROR);
  }

  const raw = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
  if (!raw) {
    throw new Error("DATABASE_URL não tem caminho do arquivo SQLite.");
  }

  return path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!client || !database) {
    const file = resolveSqliteFile(url);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    client = openNodeSqlite(file);
    database = createDatabase(client);
  }

  if (!migrated && database) {
    const migrationsFolder =
      process.env.PR_FLOW_MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
    migrate(database, { migrationsFolder });
    migrated = true;
  }

  return database;
}

export async function closeDb() {
  if (client) {
    client.close();
    client = null;
    database = null;
    migrated = false;
  }
}

function createDatabase(sqlite: NodeSqliteClient) {
  const dialect = new SQLiteSyncDialect();
  const tables = extractTablesRelationalConfig(schema, createTableRelationsHelpers);
  const relationalSchema = {
    fullSchema: schema,
    schema: tables.tables,
    tableNamesMap: tables.tableNamesMap
  };
  const session = new BetterSQLiteSession(sqlite, dialect, relationalSchema, {});
  return new BaseSQLiteDatabase("sync", dialect, session, relationalSchema);
}
