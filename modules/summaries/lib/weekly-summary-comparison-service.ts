import { previousWeekMonday } from "@/modules/summaries/lib/weekly-summary-aggregates";
import { buildWeeklySummaryContext } from "@/modules/summaries/lib/weekly-summary-context";
import type {
  WeeklyComparisonDelta,
  WeeklyDayActivity,
  WeeklyTotals
} from "@/modules/summaries/lib/weekly-summary-aggregates";

export type WeeklyComparisonResult = {
  weekMonday: string;
  previousWeekMonday: string;
  hasPreviousWeekSummary: boolean;
  totals: WeeklyTotals;
  previousTotals: WeeklyTotals | null;
  deltas: WeeklyComparisonDelta[];
  activityByDay: WeeklyDayActivity[];
  carryOverTaskCount: number;
};

export async function getWeeklyComparison(weekMonday: string): Promise<WeeklyComparisonResult> {
  const context = await buildWeeklySummaryContext(weekMonday);
  const prevMonday = previousWeekMonday(weekMonday);

  return {
    weekMonday,
    previousWeekMonday: prevMonday,
    hasPreviousWeekSummary: Boolean(context.previousWeekSummary),
    totals: context.totals,
    previousTotals: context.previousWeekTotals,
    deltas: context.comparisonDeltas,
    activityByDay: context.activityByDay,
    carryOverTaskCount: context.carryOver.pendingTasks.length
  };
}
