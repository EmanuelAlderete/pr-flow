import type { DailySummaryContext } from "@/modules/notebook-day";

export type DashboardBriefingContext = {
  today: string;
  previousBusinessDay: string;
  /** Contexto do último dia útil (ex.: sexta quando hoje é segunda). */
  lastWorkdayContext: DailySummaryContext;
  /** Contexto de hoje para projeção e prioridades. */
  todayContext: DailySummaryContext;
  /** Resumo diário persistido do último dia útil, se existir. */
  persistedDailySummaryForLastWorkday: string | null;
};

export type DashboardBriefingSuccess = {
  status: "ok";
  day: string;
  summary: string;
  generatedAt: string;
  previousBusinessDay: string;
};

export type DashboardBriefingMissingApiKey = {
  status: "missing_api_key";
  message: string;
};

export type DashboardBriefingError = {
  status: "error";
  message: string;
};

export type DashboardBriefingRateLimited = {
  status: "rate_limited";
  message: string;
};

export type DashboardBriefingNoInput = {
  status: "no_input";
  day: string;
  message: string;
};

export type DashboardBriefingNotGenerated = {
  status: "not_generated";
  day: string;
  previousBusinessDay: string;
};

export type DashboardBriefingResponse =
  | DashboardBriefingSuccess
  | DashboardBriefingMissingApiKey
  | DashboardBriefingRateLimited
  | DashboardBriefingNoInput
  | DashboardBriefingNotGenerated
  | DashboardBriefingError;
