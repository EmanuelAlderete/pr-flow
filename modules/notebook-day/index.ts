/**
 * Contexto do notebook day: montagem, tipos, regra de insumo e formatação para prompt.
 * Consumers: dashboard (briefing), summaries (daily/weekly).
 */

export type {
  DailySummaryAlreadyExists,
  DailySummaryContext,
  DailySummaryError,
  DailySummaryJiraContext,
  DailySummaryJiraItem,
  DailySummaryMissingApiKey,
  DailySummaryNoInput,
  DailySummaryNotGenerated,
  DailySummaryPrContext,
  DailySummaryPrItem,
  DailySummaryPrMergedItem,
  DailySummaryPrStatusChange,
  DailySummaryQueueItem,
  DailySummaryRateLimited,
  DailySummaryResponse,
  DailySummaryReviewEvent,
  DailySummaryReviewItem,
  DailySummarySuccess,
  DailySummaryTaskItem
} from "@/modules/notebook-day/lib/types";

export {
  buildNotebookDayContext,
  buildDailySummaryContext
} from "@/modules/notebook-day/lib/build-context";

export {
  buildDailySummaryJiraContext,
  jiraContextHasActivityOnDay
} from "@/modules/notebook-day/lib/jira-context";

export {
  buildDailySummaryPrContext,
  prContextHasSummaryInput
} from "@/modules/notebook-day/lib/pr-context";

export {
  buildDailySummaryPrompt,
  formatDailySummaryContextData
} from "@/modules/notebook-day/lib/prompt";

export {
  contextHasSummaryInput,
  dayHasSummaryInput,
  dayHasJiraActivityOnDay,
  dayHasPrActivityOnDay,
  hasNotebookContentOnDay,
  DAILY_SUMMARY_NO_INPUT_MESSAGE
} from "@/modules/notebook-day/lib/has-input";
