import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import postgres from "postgres";

if (!process.execArgv.includes("--experimental-sqlite")) {
  const child = spawnSync(
    process.execPath,
    ["--experimental-sqlite", ...process.argv.slice(1)],
    { stdio: "inherit" }
  );
  process.exit(child.status ?? 1);
}

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

const TIMESTAMP_COLUMNS = new Set([
  "completed_at",
  "deleted_at",
  "created_at",
  "updated_at",
  "generated_at",
  "last_synced_at",
  "synced_at",
  "occurred_at",
  "shared_at",
  "started_at",
  "finished_at"
]);

const JSON_COLUMNS = new Set(["payload", "issues", "data", "report"]);
const DATE_COLUMNS = new Set(["due_date", "notebook_day"]);

const TABLES = [
  "tasks",
  "notes",
  "app_settings",
  "summaries",
  "jira_sync_meta",
  "jira_sprints_cache",
  "jira_issues_cache",
  "jira_issue_details",
  "pr_sync_meta",
  "pr_monitor_cache",
  "pr_reviewer_queue_cache",
  "pr_review_context_cache",
  "pr_timeline_events",
  "monitored_repositories",
  "pr_slack_shares",
  "open_pr_branch_bases"
];

function loadEnvFile(file) {
  if (!fs.existsSync(file)) {
    return;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sourceUrl() {
  if (process.env.POSTGRES_DATABASE_URL) {
    return process.env.POSTGRES_DATABASE_URL;
  }
  const current = process.env.DATABASE_URL ?? "";
  if (current.startsWith("postgres://") || current.startsWith("postgresql://")) {
    return current.replace("@postgres:", "@localhost:");
  }
  return "postgresql://prflow:prflow@localhost:5432/prflow";
}

function sqliteFile() {
  const current = process.env.DATABASE_URL ?? "";
  if (!current.startsWith("postgres://") && !current.startsWith("postgresql://") && current.startsWith("file:")) {
    const raw = current.slice("file:".length);
    return path.isAbsolute(raw) ? raw : path.resolve(raw);
  }
  return path.resolve("data/pr-flow.sqlite");
}

function toMillis(value) {
  if (value == null) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function toDateOnly(value) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function toJson(value) {
  if (value == null) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

function convert(column, value) {
  if (TIMESTAMP_COLUMNS.has(column)) {
    return toMillis(value);
  }
  if (JSON_COLUMNS.has(column)) {
    return toJson(value);
  }
  if (DATE_COLUMNS.has(column)) {
    return toDateOnly(value);
  }
  return value;
}

function rewriteDatabaseUrl(envFile, nextUrl) {
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, `DATABASE_URL=${nextUrl}\n`);
    return;
  }
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  let replaced = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith("DATABASE_URL=") && !line.trim().startsWith("#")) {
      replaced = true;
      return `DATABASE_URL=${nextUrl}`;
    }
    return line;
  });
  if (!replaced) {
    next.push(`DATABASE_URL=${nextUrl}`);
  }
  fs.writeFileSync(envFile, next.join("\n"));
}

loadEnvFile(path.resolve(".env"));

const force = process.argv.includes("--force");
const file = sqliteFile();
const envFile = path.resolve(".env");

const migrated = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: `file:${file}` },
  stdio: "inherit"
});
if (migrated.status !== 0) {
  process.exit(migrated.status ?? 1);
}

const sqlite = new DatabaseSync(file);
const alreadyCopied = TABLES.some((table) => {
  const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
  return row.count > 0;
});
if (!force && alreadyCopied) {
  console.log("SQLite já tem dados. Nada foi copiado. Use --force para substituir.");
  sqlite.close();
  process.exit(0);
}

const sql = postgres(sourceUrl(), { max: 1, onnotice: () => {} });

try {
  const copy = (tableRows) => {
    sqlite.exec("BEGIN");
    try {
      if (force) {
        for (const table of [...TABLES].reverse()) {
          sqlite.prepare(`DELETE FROM ${table}`).run();
        }
      }
      for (const { table, rows } of tableRows) {
        if (rows.length === 0) {
          continue;
        }
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => "?").join(", ");
        const insert = sqlite.prepare(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`
        );
        for (const row of rows) {
          const values = columns.map((column) => {
            const value = convert(column, row[column]);
            return value === undefined ? null : value;
          });
          insert.run(...values);
        }
        console.log(`${table}: ${rows.length}`);
      }
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  };

  const tableRows = [];
  for (const table of TABLES) {
    const present = await sql`
      SELECT to_regclass(${`public.${table}`}) AS name
    `;
    if (!present[0]?.name) {
      console.log(`${table}: ausente no Postgres, ignorada`);
      continue;
    }
    const rows = await sql.unsafe(`SELECT * FROM ${table}`);
    tableRows.push({ table, rows });
  }

  copy(tableRows);
  rewriteDatabaseUrl(envFile, "file:./data/pr-flow.sqlite");
  console.log("Dados copiados. DATABASE_URL no .env aponta para file:./data/pr-flow.sqlite.");
} catch (error) {
  console.error("Falha ao copiar o Postgres:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  sqlite.close();
  await sql.end();
}
