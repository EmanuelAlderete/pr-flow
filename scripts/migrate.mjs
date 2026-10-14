import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

if (!process.execArgv.includes("--experimental-sqlite")) {
  const child = spawnSync(
    process.execPath,
    ["--experimental-sqlite", ...process.argv.slice(1)],
    { stdio: "inherit" }
  );
  process.exit(child.status ?? 1);
}

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

function resolveSqliteFile() {
  const url = process.env.DATABASE_URL ?? "file:./data/pr-flow.sqlite";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return path.resolve("data/pr-flow.sqlite");
  }
  const raw = url.startsWith("file:") ? url.slice("file:".length) : url;
  return path.isAbsolute(raw) ? raw : path.resolve(raw);
}

function readMigrations(migrationsFolder) {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  return journal.entries.map((entry) => {
    const file = path.join(migrationsFolder, `${entry.tag}.sql`);
    const query = fs.readFileSync(file, "utf8");
    return {
      statements: query
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean),
      folderMillis: entry.when,
      hash: createHash("sha256").update(query).digest("hex")
    };
  });
}

const file = resolveSqliteFile();
fs.mkdirSync(path.dirname(file), { recursive: true });
const sqlite = new DatabaseSync(file);
sqlite.exec("PRAGMA journal_mode = WAL");

try {
  const migrationsFolder = process.env.PR_FLOW_MIGRATIONS_DIR ?? path.resolve("drizzle");
  const migrations = readMigrations(migrationsFolder);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);
  const last = sqlite
    .prepare("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1")
    .get();
  const lastAt = last ? Number(last.created_at) : null;

  sqlite.exec("BEGIN");
  try {
    const insert = sqlite.prepare(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
    );
    for (const migration of migrations) {
      if (lastAt !== null && lastAt >= migration.folderMillis) {
        continue;
      }
      for (const statement of migration.statements) {
        sqlite.exec(statement);
      }
      insert.run(migration.hash, migration.folderMillis);
    }
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
  console.log(`SQLite migrations applied (${file}).`);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  sqlite.close();
}
