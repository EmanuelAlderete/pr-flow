import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const SQLITE_FLAG_ERROR =
  "SQLite do Node está desligado. Use Node 22 e NODE_OPTIONS=--experimental-sqlite (os scripts npm já passam essa flag).";

type RunResult = {
  changes: number;
  lastInsertRowid: number | bigint;
};

type SyncStatement = {
  run: (...params: unknown[]) => RunResult;
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Record<string, unknown>[];
};

type SyncDatabase = {
  prepare: (sql: string) => SyncStatement;
  exec: (sql: string) => void;
  close: () => void;
};

export type NodeSqliteClient = {
  prepare: (sql: string) => {
    run: (...params: unknown[]) => RunResult;
    get: (...params: unknown[]) => Record<string, unknown> | undefined;
    all: (...params: unknown[]) => Record<string, unknown>[];
    raw: () => {
      get: (...params: unknown[]) => unknown[] | undefined;
      all: (...params: unknown[]) => unknown[][];
    };
  };
  exec: (sql: string) => void;
  transaction: (fn: (arg: unknown) => unknown) => {
    deferred: (arg: unknown) => unknown;
    immediate: (arg: unknown) => unknown;
    exclusive: (arg: unknown) => unknown;
  };
  close: () => void;
};

export function openNodeSqlite(file: string): NodeSqliteClient {
  const DatabaseSync = loadDatabaseSync();
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");

  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...params),
        get: (...params: unknown[]) => stmt.get(...params),
        all: (...params: unknown[]) => stmt.all(...params),
        raw: () => ({
          get: (...params: unknown[]) => {
            const row = stmt.get(...params);
            return row ? Object.values(row) : undefined;
          },
          all: (...params: unknown[]) => stmt.all(...params).map((row) => Object.values(row))
        })
      };
    },
    exec(sql: string) {
      db.exec(sql);
    },
    transaction(fn) {
      const run = (arg: unknown) => {
        db.exec("BEGIN");
        try {
          const result = fn(arg);
          db.exec("COMMIT");
          return result;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      };
      return { deferred: run, immediate: run, exclusive: run };
    },
    close() {
      db.close();
    }
  };
}

function loadDatabaseSync(): new (path: string) => SyncDatabase {
  const sqlite = process.getBuiltinModule?.("node:sqlite") as
    | { DatabaseSync?: new (path: string) => SyncDatabase }
    | undefined;
  if (sqlite?.DatabaseSync) {
    return sqlite.DatabaseSync;
  }

  try {
    const required = require("node:sqlite") as { DatabaseSync?: new (path: string) => SyncDatabase };
    if (required.DatabaseSync) {
      return required.DatabaseSync;
    }
  } catch {
    // Next bundles `require`; the builtin is loaded above when the flag is on.
  }

  throw new Error(SQLITE_FLAG_ERROR);
}
