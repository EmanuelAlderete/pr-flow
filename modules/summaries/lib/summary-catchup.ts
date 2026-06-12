import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";
import {
  catchupDailyStartDay,
  enumerateDaysInclusive,
  lastCompletedWeekMonday,
  yesterdayLocalDay
} from "@/modules/summaries/lib/summary-period";
import {
  generateAndPersistDailySummary,
  generateAndPersistWeeklySummary
} from "@/modules/summaries/lib/summary-generation-service";
import { getLatestDailyPeriodKey } from "@/modules/summaries/lib/summary-repository";

export type SummaryCatchupReport = {
  dailyGenerated: string[];
  dailySkipped: string[];
  dailyFailed: string[];
  weeklyGenerated: string[];
  weeklySkipped: string[];
  weeklyFailed: string[];
};

export async function runSummaryCatchup(): Promise<SummaryCatchupReport> {
  const report: SummaryCatchupReport = {
    dailyGenerated: [],
    dailySkipped: [],
    dailyFailed: [],
    weeklyGenerated: [],
    weeklySkipped: [],
    weeklyFailed: []
  };

  if (!process.env.DATABASE_URL) {
    return report;
  }

  const yesterday = yesterdayLocalDay();
  if (!isValidNotebookDay(yesterday)) {
    return report;
  }

  const lastDaily = await getLatestDailyPeriodKey();
  const startDay = catchupDailyStartDay(lastDaily, yesterday);

  for (const day of enumerateDaysInclusive(startDay, yesterday)) {
    const result = await generateAndPersistDailySummary(day);
    if (result.status === "ok") {
      report.dailyGenerated.push(day);
    } else if (result.status === "skipped") {
      report.dailySkipped.push(day);
    } else if (result.status === "missing_api_key" || result.status === "rate_limited") {
      return report;
    } else if (result.status === "error") {
      report.dailyFailed.push(day);
    }
  }

  const weekMonday = lastCompletedWeekMonday();
  const weeklyResult = await generateAndPersistWeeklySummary(weekMonday);
  if (weeklyResult.status === "ok") {
    report.weeklyGenerated.push(weekMonday);
  } else if (weeklyResult.status === "skipped") {
    report.weeklySkipped.push(weekMonday);
  } else if (weeklyResult.status === "error") {
    report.weeklyFailed.push(weekMonday);
  }

  return report;
}
