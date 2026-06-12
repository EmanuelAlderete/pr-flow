import { eq, notInArray } from "drizzle-orm";
import type {
  JiraIssueDetailDto,
  JiraIssueDto,
  JiraIssuesResponse,
  JiraSprintsResponse
} from "@/modules/jira/lib/domain";
import {
  jiraIssueDetails,
  jiraIssuesCache,
  jiraSprintsCache,
  jiraSyncMeta
} from "@/modules/jira/lib/schema";
import { getDb } from "@/modules/db/lib/db";

const SINGLETON_ID = "default";

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export async function getJiraSyncMeta() {
  const db = getDb();
  const [row] = await db.select().from(jiraSyncMeta).where(eq(jiraSyncMeta.id, SINGLETON_ID));
  return row ?? null;
}

export async function hasJiraCache(): Promise<boolean> {
  const meta = await getJiraSyncMeta();
  return meta?.lastSyncedAt != null;
}

export async function saveJiraSyncMeta(input: {
  email: string;
  displayName: string | null;
  status: "ok" | "error";
  error?: string | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(jiraSyncMeta)
    .values({
      id: SINGLETON_ID,
      email: input.email,
      displayName: input.displayName,
      lastSyncedAt: now,
      lastSyncStatus: input.status,
      lastSyncError: input.error ?? null
    })
    .onConflictDoUpdate({
      target: jiraSyncMeta.id,
      set: {
        email: input.email,
        displayName: input.displayName,
        lastSyncedAt: now,
        lastSyncStatus: input.status,
        lastSyncError: input.error ?? null
      }
    });
}

export async function saveJiraSprintsCache(payload: Omit<JiraSprintsResponse, "cachedAt">): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(jiraSprintsCache)
    .values({
      id: SINGLETON_ID,
      payload: payload as JiraSprintsResponse,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: jiraSprintsCache.id,
      set: {
        payload: payload as JiraSprintsResponse,
        syncedAt: now
      }
    });
}

export async function loadJiraSprintsCache(): Promise<JiraSprintsResponse | null> {
  const db = getDb();
  const [row] = await db.select().from(jiraSprintsCache).where(eq(jiraSprintsCache.id, SINGLETON_ID));
  if (!row) {
    return null;
  }

  const { cachedAt: _ignored, ...payload } = row.payload;
  return {
    ...payload,
    cachedAt: toIso(row.syncedAt)
  };
}

export async function saveJiraIssuesCache(
  sprintFilter: string,
  issues: JiraIssueDto[]
): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(jiraIssuesCache)
    .values({
      sprintFilter,
      issues,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: jiraIssuesCache.sprintFilter,
      set: {
        issues,
        syncedAt: now
      }
    });
}

export async function loadJiraIssuesCache(sprintFilter: string): Promise<{
  issues: JiraIssueDto[];
  cachedAt: string | null;
} | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(jiraIssuesCache)
    .where(eq(jiraIssuesCache.sprintFilter, sprintFilter));

  if (!row) {
    return null;
  }

  return {
    issues: row.issues,
    cachedAt: toIso(row.syncedAt)
  };
}

export async function buildJiraIssuesResponse(
  sprintFilter: string
): Promise<JiraIssuesResponse | null> {
  const meta = await getJiraSyncMeta();
  if (!meta?.lastSyncedAt) {
    return null;
  }

  const cached = await loadJiraIssuesCache(sprintFilter);
  const issues = cached?.issues ?? [];

  return {
    email: meta.email,
    displayName: meta.displayName,
    sprintFilter,
    issues,
    cachedAt: cached?.cachedAt ?? toIso(meta.lastSyncedAt)
  };
}

export async function saveJiraIssueDetail(issueKey: string, payload: Omit<JiraIssueDetailDto, "cachedAt">) {
  const db = getDb();
  const now = new Date();

  await db
    .insert(jiraIssueDetails)
    .values({
      issueKey,
      payload: payload as JiraIssueDetailDto,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: jiraIssueDetails.issueKey,
      set: {
        payload: payload as JiraIssueDetailDto,
        syncedAt: now
      }
    });
}

export async function findJiraIssueInCache(issueKey: string): Promise<JiraIssueDto | null> {
  const db = getDb();
  const normalizedKey = issueKey.trim().toUpperCase();
  const rows = await db.select().from(jiraIssuesCache);

  for (const row of rows) {
    const found = row.issues.find((issue) => issue.key.toUpperCase() === normalizedKey);
    if (found) {
      return found;
    }
  }

  return null;
}

export async function loadJiraIssueDetail(issueKey: string): Promise<JiraIssueDetailDto | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(jiraIssueDetails)
    .where(eq(jiraIssueDetails.issueKey, issueKey));

  if (!row) {
    return null;
  }

  const { cachedAt: _ignored, ...payload } = row.payload;
  return {
    ...payload,
    cachedAt: toIso(row.syncedAt)
  };
}

export async function pruneJiraIssuesCache(activeFilters: string[]): Promise<void> {
  const db = getDb();
  if (activeFilters.length === 0) {
    await db.delete(jiraIssuesCache);
    return;
  }

  await db
    .delete(jiraIssuesCache)
    .where(notInArray(jiraIssuesCache.sprintFilter, activeFilters));
}

export async function pruneJiraIssueDetails(activeKeys: string[]): Promise<void> {
  const db = getDb();
  if (activeKeys.length === 0) {
    await db.delete(jiraIssueDetails);
    return;
  }

  await db.delete(jiraIssueDetails).where(notInArray(jiraIssueDetails.issueKey, activeKeys));
}
