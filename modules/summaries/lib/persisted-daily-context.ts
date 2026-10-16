import { buildNotebookDayContext, type DailySummaryContext } from "@/modules/notebook-day";
import {
  createDrizzleFollowUpStore,
  gapFactsFromAnswers,
  mentoringReadingsFromAnswers
} from "@/modules/day-follow-up/lib/repository";
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
  const [previousSummary, answers] = await Promise.all([
    getSummaryByTypeAndPeriod("daily", previousDay),
    createDrizzleFollowUpStore().listAnswers(day)
  ]);

  return {
    ...base,
    gapFacts: gapFactsFromAnswers(answers),
    mentoringReadings: mentoringReadingsFromAnswers(answers),
    previousDaySummary: previousSummary?.content ?? null
  };
}
