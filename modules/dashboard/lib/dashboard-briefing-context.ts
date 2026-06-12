import type { DashboardBriefingContext } from "@/modules/dashboard/lib/dashboard-briefing-types";
import { buildNotebookDayContext } from "@/modules/notebook-day";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { previousBusinessDay } from "@/modules/summaries/lib/summary-period";
import { getSummaryByTypeAndPeriod } from "@/modules/summaries/lib/summary-repository";

export async function buildDashboardBriefingContext(
  today: string = todayLocalDateString()
): Promise<DashboardBriefingContext> {
  const lastWorkday = previousBusinessDay(today);

  const [lastWorkdayContext, todayContext, persistedDaily] = await Promise.all([
    buildNotebookDayContext(lastWorkday),
    buildNotebookDayContext(today),
    getSummaryByTypeAndPeriod("daily", lastWorkday)
  ]);

  return {
    today,
    previousBusinessDay: lastWorkday,
    lastWorkdayContext,
    todayContext,
    persistedDailySummaryForLastWorkday: persistedDaily?.content ?? null
  };
}
