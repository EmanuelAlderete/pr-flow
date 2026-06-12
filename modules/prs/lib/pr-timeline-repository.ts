import { and, asc, eq } from "drizzle-orm";
import type { PrTimelineEventInsert, PrTimelineEventRecord } from "@/modules/prs/lib/domain";
import { prTimelineEvents } from "@/modules/prs/lib/schema";
import { getDb } from "@/modules/db/lib/db";

function rowToRecord(row: typeof prTimelineEvents.$inferSelect): PrTimelineEventRecord {
  return {
    id: row.id,
    githubLogin: row.githubLogin,
    notebookDay: row.notebookDay,
    occurredAt: row.occurredAt.toISOString(),
    eventType: row.eventType as PrTimelineEventRecord["eventType"],
    prId: row.prId,
    prNumber: row.prNumber,
    prTitle: row.prTitle,
    repository: row.repository,
    jiraIssueKey: row.jiraIssueKey,
    payload: row.payload,
    dedupeKey: row.dedupeKey
  };
}

export async function insertPrTimelineEvents(events: PrTimelineEventInsert[]): Promise<number> {
  if (events.length === 0) {
    return 0;
  }

  const db = getDb();
  const inserted = await db
    .insert(prTimelineEvents)
    .values(
      events.map((event) => ({
        githubLogin: event.githubLogin,
        notebookDay: event.notebookDay,
        occurredAt: new Date(event.occurredAt),
        eventType: event.eventType,
        prId: event.prId,
        prNumber: event.prNumber,
        prTitle: event.prTitle,
        repository: event.repository,
        jiraIssueKey: event.jiraIssueKey,
        payload: event.payload,
        dedupeKey: event.dedupeKey
      }))
    )
    .onConflictDoNothing({ target: prTimelineEvents.dedupeKey })
    .returning({ id: prTimelineEvents.id });

  return inserted.length;
}

export async function listPrTimelineEventsByNotebookDay(
  githubLogin: string,
  notebookDay: string
): Promise<PrTimelineEventRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(prTimelineEvents)
    .where(and(eq(prTimelineEvents.githubLogin, githubLogin), eq(prTimelineEvents.notebookDay, notebookDay)))
    .orderBy(asc(prTimelineEvents.occurredAt));

  return rows.map(rowToRecord);
}

export async function notebookDayHasPrTimelineEvents(
  githubLogin: string,
  notebookDay: string
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: prTimelineEvents.id })
    .from(prTimelineEvents)
    .where(and(eq(prTimelineEvents.githubLogin, githubLogin), eq(prTimelineEvents.notebookDay, notebookDay)))
    .limit(1);

  return Boolean(row);
}
