import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/modules/db/lib/db";
import {
  openPrBranchBases,
  type OpenPrBranchBaseInsert,
  type OpenPrBranchBaseRow
} from "@/modules/prs/lib/schema";

export type OpenPrBranchBaseRecord = {
  id: string;
  repository: string;
  branchName: string;
  baseBranch: string;
  createdAt: Date;
  updatedAt: Date;
};

function toRecord(row: OpenPrBranchBaseRow): OpenPrBranchBaseRecord {
  return {
    id: row.id,
    repository: row.repository,
    branchName: row.branchName,
    baseBranch: row.baseBranch,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function listOpenPrBranchBasesForRepository(
  repository: string
): Promise<OpenPrBranchBaseRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(openPrBranchBases)
    .where(eq(openPrBranchBases.repository, repository));

  return rows.map(toRecord);
}

export async function getOpenPrBranchBase(
  repository: string,
  branchName: string
): Promise<OpenPrBranchBaseRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(openPrBranchBases)
    .where(
      and(eq(openPrBranchBases.repository, repository), eq(openPrBranchBases.branchName, branchName))
    )
    .limit(1);

  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function getOpenPrBranchBaseMap(
  repository: string,
  branchNames: string[]
): Promise<Map<string, string>> {
  if (branchNames.length === 0) {
    return new Map();
  }

  const db = getDb();
  const rows = await db
    .select({
      branchName: openPrBranchBases.branchName,
      baseBranch: openPrBranchBases.baseBranch
    })
    .from(openPrBranchBases)
    .where(
      and(
        eq(openPrBranchBases.repository, repository),
        inArray(openPrBranchBases.branchName, branchNames)
      )
    );

  return new Map(rows.map((row) => [row.branchName, row.baseBranch]));
}

export async function upsertOpenPrBranchBase(
  input: Pick<OpenPrBranchBaseInsert, "repository" | "branchName" | "baseBranch">
): Promise<OpenPrBranchBaseRecord> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .insert(openPrBranchBases)
    .values({
      repository: input.repository,
      branchName: input.branchName,
      baseBranch: input.baseBranch,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [openPrBranchBases.repository, openPrBranchBases.branchName],
      set: {
        baseBranch: input.baseBranch,
        updatedAt: now
      }
    })
    .returning();

  return toRecord(rows[0]!);
}

export async function updateOpenPrBranchBaseTargets(
  repository: string,
  fromBaseBranch: string,
  toBaseBranch: string
): Promise<number> {
  if (fromBaseBranch === toBaseBranch) {
    return 0;
  }

  const db = getDb();
  const rows = await db
    .update(openPrBranchBases)
    .set({
      baseBranch: toBaseBranch,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(openPrBranchBases.repository, repository),
        eq(openPrBranchBases.baseBranch, fromBaseBranch)
      )
    )
    .returning({ id: openPrBranchBases.id });

  return rows.length;
}

export async function listDistinctOpenPrBaseBranchesForRepository(
  repository: string
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ baseBranch: openPrBranchBases.baseBranch })
    .from(openPrBranchBases)
    .where(eq(openPrBranchBases.repository, repository));

  return rows.map((row) => row.baseBranch).sort((a, b) => a.localeCompare(b));
}
