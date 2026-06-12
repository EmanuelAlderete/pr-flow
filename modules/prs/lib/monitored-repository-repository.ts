import { asc, eq } from "drizzle-orm";
import { getDb } from "@/modules/db/lib/db";
import {
  monitoredRepositories,
  type MonitoredRepositoryInsert,
  type MonitoredRepositoryRow
} from "@/modules/prs/lib/schema";

export type MonitoredRepositoryRecord = {
  id: string;
  repository: string;
  defaultBranch: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function toRecord(row: MonitoredRepositoryRow): MonitoredRepositoryRecord {
  return {
    id: row.id,
    repository: row.repository,
    defaultBranch: row.defaultBranch,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function countMonitoredRepositories(): Promise<number> {
  const db = getDb();
  const rows = await db.select({ id: monitoredRepositories.id }).from(monitoredRepositories);
  return rows.length;
}

export async function listMonitoredRepositories(): Promise<MonitoredRepositoryRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(monitoredRepositories)
    .orderBy(asc(monitoredRepositories.sortOrder), asc(monitoredRepositories.repository));

  return rows.map(toRecord);
}

export async function listMonitoredRepositorySlugs(): Promise<string[]> {
  const rows = await listMonitoredRepositories();
  return rows.map((row) => row.repository);
}

export async function getMonitoredRepositoryBySlug(
  repository: string
): Promise<MonitoredRepositoryRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(monitoredRepositories)
    .where(eq(monitoredRepositories.repository, repository))
    .limit(1);

  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function getMonitoredRepositoryById(
  id: string
): Promise<MonitoredRepositoryRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(monitoredRepositories)
    .where(eq(monitoredRepositories.id, id))
    .limit(1);

  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function insertMonitoredRepository(
  input: Pick<MonitoredRepositoryInsert, "repository" | "defaultBranch" | "sortOrder">
): Promise<MonitoredRepositoryRecord> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .insert(monitoredRepositories)
    .values({
      repository: input.repository,
      defaultBranch: input.defaultBranch,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return toRecord(rows[0]!);
}

export async function updateMonitoredRepository(
  id: string,
  input: Partial<Pick<MonitoredRepositoryInsert, "repository" | "defaultBranch" | "sortOrder">>
): Promise<MonitoredRepositoryRecord | null> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .update(monitoredRepositories)
    .set({
      ...input,
      updatedAt: now
    })
    .where(eq(monitoredRepositories.id, id))
    .returning();

  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function deleteMonitoredRepository(id: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .delete(monitoredRepositories)
    .where(eq(monitoredRepositories.id, id))
    .returning({ id: monitoredRepositories.id });

  return rows.length > 0;
}

export async function insertMonitoredRepositoriesBatch(
  items: Array<Pick<MonitoredRepositoryInsert, "repository" | "defaultBranch" | "sortOrder">>
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const db = getDb();
  const now = new Date();

  await db.insert(monitoredRepositories).values(
    items.map((item, index) => ({
      repository: item.repository,
      defaultBranch: item.defaultBranch,
      sortOrder: item.sortOrder ?? index,
      createdAt: now,
      updatedAt: now
    }))
  );
}
