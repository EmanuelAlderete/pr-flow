import { buildNotebookDayContext, type DailySummaryContext } from "@/modules/notebook-day";
import { dayHasSummaryInput } from "@/modules/summaries/lib/summary-input";
import {
  getSummaryByTypeAndPeriod,
  listDailySummariesInRange
} from "@/modules/summaries/lib/summary-repository";
import { sundayOfWeek, weekDayRange } from "@/modules/summaries/lib/summary-period";
import {
  buildWeeklyComparisonDeltas,
  computeWeeklyActivityByDay,
  computeWeeklyCarryOver,
  computeWeeklyTotals,
  previousWeekMonday,
  type WeeklyCarryOver,
  type WeeklyComparisonDelta,
  type WeeklyDayActivity,
  type WeeklyTotals
} from "@/modules/summaries/lib/weekly-summary-aggregates";

export type WeeklyDaySnapshot = {
  day: string;
  context: DailySummaryContext;
  persistedSummary: string | null;
};

export type WeeklySummaryContext = {
  weekMonday: string;
  weekSunday: string;
  days: WeeklyDaySnapshot[];
  totals: WeeklyTotals;
  previousWeekTotals: WeeklyTotals | null;
  comparisonDeltas: WeeklyComparisonDelta[];
  carryOver: WeeklyCarryOver;
  previousWeekSummary: string | null;
  activityByDay: WeeklyDayActivity[];
};

async function buildWeeklyDaySnapshots(weekMonday: string): Promise<WeeklyDaySnapshot[]> {
  const daysInWeek = weekDayRange(weekMonday);
  const weekSunday = sundayOfWeek(weekMonday);
  const persistedByDay = new Map(
    (await listDailySummariesInRange(weekMonday, weekSunday)).map((summary) => [
      summary.periodKey,
      summary.content
    ])
  );

  const days: WeeklyDaySnapshot[] = [];
  for (const day of daysInWeek) {
    if (!(await dayHasSummaryInput(day))) {
      continue;
    }
    days.push({
      day,
      context: await buildNotebookDayContext(day),
      persistedSummary: persistedByDay.get(day) ?? null
    });
  }

  return days;
}

export async function buildWeeklySummaryContext(weekMonday: string): Promise<WeeklySummaryContext> {
  const weekSunday = sundayOfWeek(weekMonday);
  const days = await buildWeeklyDaySnapshots(weekMonday);
  const totals = computeWeeklyTotals(days);

  const prevMonday = previousWeekMonday(weekMonday);
  let previousWeekTotals: WeeklyTotals | null = null;
  try {
    const previousDays = await buildWeeklyDaySnapshots(prevMonday);
    if (previousDays.length > 0) {
      previousWeekTotals = computeWeeklyTotals(previousDays);
    }
  } catch {
    previousWeekTotals = null;
  }

  const previousWeek = await getSummaryByTypeAndPeriod("weekly", prevMonday);

  return {
    weekMonday,
    weekSunday,
    days,
    totals,
    previousWeekTotals,
    comparisonDeltas: buildWeeklyComparisonDeltas(totals, previousWeekTotals),
    carryOver: computeWeeklyCarryOver(days, weekSunday),
    previousWeekSummary: previousWeek?.content ?? null,
    activityByDay: computeWeeklyActivityByDay(days, weekMonday)
  };
}
