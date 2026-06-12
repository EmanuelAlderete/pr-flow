import { eq } from "drizzle-orm";
import { getGithubLogin } from "@/modules/app/lib/github-login-repository";
import type { MonitoredPr, PrReviewContextRecord, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import { prMonitorCache, prReviewContextCache, prReviewerQueueCache, prSyncMeta } from "@/modules/prs/lib/schema";
import { getDb } from "@/modules/db/lib/db";

const SINGLETON_ID = "default";

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export async function getPrSyncMeta() {
  const db = getDb();
  const [row] = await db.select().from(prSyncMeta).where(eq(prSyncMeta.id, SINGLETON_ID));
  return row ?? null;
}

export async function hasPrCache(): Promise<boolean> {
  const meta = await getPrSyncMeta();
  return meta?.lastSyncedAt != null && meta.lastSyncStatus === "ok";
}

export async function savePrSyncMeta(input: {
  githubLogin: string | null;
  status: "ok" | "unauthenticated" | "error";
  error?: string | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(prSyncMeta)
    .values({
      id: SINGLETON_ID,
      githubLogin: input.githubLogin,
      lastSyncedAt: now,
      lastSyncStatus: input.status,
      lastSyncError: input.error ?? null
    })
    .onConflictDoUpdate({
      target: prSyncMeta.id,
      set: {
        githubLogin: input.githubLogin,
        lastSyncedAt: now,
        lastSyncStatus: input.status,
        lastSyncError: input.error ?? null
      }
    });
}

export async function savePrCaches(input: {
  monitor: MonitoredPr[];
  reviewerQueue: ReviewerQueuePr[];
  reviewContext: PrReviewContextRecord[];
  githubLogin: string;
}): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .insert(prMonitorCache)
    .values({
      id: SINGLETON_ID,
      data: input.monitor,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: prMonitorCache.id,
      set: {
        data: input.monitor,
        syncedAt: now
      }
    });

  await db
    .insert(prReviewerQueueCache)
    .values({
      id: SINGLETON_ID,
      data: input.reviewerQueue,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: prReviewerQueueCache.id,
      set: {
        data: input.reviewerQueue,
        syncedAt: now
      }
    });

  await db
    .insert(prReviewContextCache)
    .values({
      id: SINGLETON_ID,
      data: input.reviewContext,
      syncedAt: now
    })
    .onConflictDoUpdate({
      target: prReviewContextCache.id,
      set: {
        data: input.reviewContext,
        syncedAt: now
      }
    });

  await savePrSyncMeta({
    githubLogin: input.githubLogin,
    status: "ok",
    error: null
  });
}

async function resolvePrGithubLogin(metaGithubLogin: string | null | undefined): Promise<string | null> {
  if (metaGithubLogin?.trim()) {
    return metaGithubLogin.trim();
  }

  return getGithubLogin();
}

export async function loadPrMonitorCache(): Promise<{
  data: MonitoredPr[];
  fetchedAt: string;
  githubLogin: string;
} | null> {
  const meta = await getPrSyncMeta();
  if (!meta?.lastSyncedAt || meta.lastSyncStatus !== "ok") {
    return null;
  }

  const db = getDb();
  const [row] = await db.select().from(prMonitorCache).where(eq(prMonitorCache.id, SINGLETON_ID));
  if (!row || !meta.githubLogin) {
    return null;
  }

  return {
    data: row.data,
    fetchedAt: toIso(row.syncedAt) ?? meta.lastSyncedAt.toISOString(),
    githubLogin: meta.githubLogin
  };
}

export async function loadPrMonitorCacheAllowStale(): Promise<{
  data: MonitoredPr[];
  fetchedAt: string;
  githubLogin: string;
} | null> {
  const db = getDb();
  const [row] = await db.select().from(prMonitorCache).where(eq(prMonitorCache.id, SINGLETON_ID));
  if (!row) {
    return null;
  }

  const meta = await getPrSyncMeta();
  const githubLogin = await resolvePrGithubLogin(meta?.githubLogin);
  if (!githubLogin) {
    return null;
  }

  return {
    data: row.data,
    fetchedAt: toIso(row.syncedAt) ?? new Date().toISOString(),
    githubLogin
  };
}

export async function loadPrReviewerQueueCache(): Promise<{
  data: ReviewerQueuePr[];
  fetchedAt: string;
  githubLogin: string;
} | null> {
  const meta = await getPrSyncMeta();
  if (!meta?.lastSyncedAt || meta.lastSyncStatus !== "ok") {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(prReviewerQueueCache)
    .where(eq(prReviewerQueueCache.id, SINGLETON_ID));
  if (!row || !meta.githubLogin) {
    return null;
  }

  return {
    data: row.data,
    fetchedAt: toIso(row.syncedAt) ?? meta.lastSyncedAt.toISOString(),
    githubLogin: meta.githubLogin
  };
}

export async function loadPrReviewerQueueCacheAllowStale(): Promise<{
  data: ReviewerQueuePr[];
  fetchedAt: string;
  githubLogin: string;
} | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(prReviewerQueueCache)
    .where(eq(prReviewerQueueCache.id, SINGLETON_ID));
  if (!row) {
    return null;
  }

  const meta = await getPrSyncMeta();
  const githubLogin = await resolvePrGithubLogin(meta?.githubLogin);
  if (!githubLogin) {
    return null;
  }

  return {
    data: row.data,
    fetchedAt: toIso(row.syncedAt) ?? new Date().toISOString(),
    githubLogin
  };
}

export async function loadPrReviewContextCache(): Promise<{
  data: PrReviewContextRecord[];
  fetchedAt: string;
  githubLogin: string;
} | null> {
  const meta = await getPrSyncMeta();
  if (!meta?.lastSyncedAt || meta.lastSyncStatus !== "ok") {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(prReviewContextCache)
    .where(eq(prReviewContextCache.id, SINGLETON_ID));
  if (!row || !meta.githubLogin) {
    return null;
  }

  return {
    data: row.data,
    fetchedAt: toIso(row.syncedAt) ?? meta.lastSyncedAt.toISOString(),
    githubLogin: meta.githubLogin
  };
}
