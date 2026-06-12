import { and, desc, eq, inArray } from "drizzle-orm";
import type { SummaryDto } from "@/modules/summaries/lib/domain";
import { summaries, type SummaryType } from "@/modules/summaries/lib/schema";
import { getDb } from "@/modules/db/lib/db";

function toDto(row: typeof summaries.$inferSelect): SummaryDto {
  return {
    id: row.id,
    type: row.type,
    periodKey: row.periodKey,
    content: row.content,
    generatedAt: row.generatedAt.toISOString()
  };
}

export async function getSummaryByTypeAndPeriod(
  type: SummaryType,
  periodKey: string
): Promise<SummaryDto | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(summaries)
    .where(and(eq(summaries.type, type), eq(summaries.periodKey, periodKey)));

  return row ? toDto(row) : null;
}

export async function listSummaries(options?: {
  type?: SummaryType;
  limit?: number;
}): Promise<SummaryDto[]> {
  const db = getDb();
  const limit = options?.limit ?? 50;

  const base = db.select().from(summaries);
  const filtered = options?.type
    ? base.where(eq(summaries.type, options.type))
    : base.where(inArray(summaries.type, ["daily", "weekly"]));
  const rows = await filtered.orderBy(desc(summaries.generatedAt)).limit(limit);

  return rows.map(toDto);
}

export async function getLatestDailyPeriodKey(): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ periodKey: summaries.periodKey })
    .from(summaries)
    .where(eq(summaries.type, "daily"))
    .orderBy(desc(summaries.periodKey))
    .limit(1);

  return row?.periodKey ?? null;
}

export async function saveSummary(input: {
  type: SummaryType;
  periodKey: string;
  content: string;
}): Promise<SummaryDto> {
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .insert(summaries)
    .values({
      type: input.type,
      periodKey: input.periodKey,
      content: input.content,
      generatedAt: now
    })
    .onConflictDoUpdate({
      target: [summaries.type, summaries.periodKey],
      set: {
        content: input.content,
        generatedAt: now
      }
    })
    .returning();

  return toDto(row);
}

export async function listDailySummariesInRange(
  startDay: string,
  endDay: string
): Promise<SummaryDto[]> {
  const all = await listSummaries({ type: "daily", limit: 100 });
  return all
    .filter((summary) => summary.periodKey >= startDay && summary.periodKey <= endDay)
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}
