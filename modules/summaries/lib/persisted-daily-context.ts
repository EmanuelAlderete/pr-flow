import { buildNotebookDayContext, type DailySummaryContext } from "@/modules/notebook-day";
import { dayBefore } from "@/modules/summaries/lib/summary-period";
import { getSummaryByTypeAndPeriod } from "@/modules/summaries/lib/summary-repository";

export type PersistedDailySummaryContext = DailySummaryContext & {
  previousDaySummary: string | null;
};

export async function buildPersistedDailySummaryContext(
  day: string
): Promise<PersistedDailySummaryContext> {
  const base = await buildNotebookDayContext(day);
  const previousDay = dayBefore(day);
  const previousSummary = await getSummaryByTypeAndPeriod("daily", previousDay);

  return {
    ...base,
    previousDaySummary: previousSummary?.content ?? null
  };
}
