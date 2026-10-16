import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  generateLlmText,
  hasLlmApiKey
} from "@/modules/llm-generation";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";
import { ptBR } from "@/modules/messages";
import { isNotebookDayQuizWindowOpen } from "@/modules/day-follow-up/lib/quiz-window-status";
import { buildPersistedDailySummaryContext } from "@/modules/summaries/lib/persisted-daily-context";
import { buildPersistedDailySummaryPrompt } from "@/modules/summaries/lib/persisted-daily-prompt";
import type { SummaryDto } from "@/modules/summaries/lib/domain";
import {
  getSummaryByTypeAndPeriod,
  saveSummary
} from "@/modules/summaries/lib/summary-repository";
import {
  DAILY_SUMMARY_NO_INPUT_MESSAGE,
  WEEKLY_SUMMARY_NO_INPUT_MESSAGE,
  dayHasSummaryInput,
  weekHasSummaryInput
} from "@/modules/summaries/lib/summary-input";
import { buildWeeklySummaryContext } from "@/modules/summaries/lib/weekly-summary-context";
import { buildWeeklySummaryPrompt } from "@/modules/summaries/lib/weekly-summary-prompt";

export type SummaryGenerationResult =
  | { status: "ok"; summary: SummaryDto }
  | { status: "skipped"; reason: string }
  | { status: "missing_api_key"; message: string }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };

function missingApiKeyResult(): SummaryGenerationResult {
  return {
    status: "missing_api_key",
    message: ptBR.summary.missingApiKey
  };
}

export async function generateAndPersistDailySummary(
  day: string,
  options?: { force?: boolean; refresh?: boolean; now?: Date }
): Promise<SummaryGenerationResult> {
  if (!isValidNotebookDay(day)) {
    return { status: "error", message: ptBR.summary.invalidDate };
  }

  const existing = await getSummaryByTypeAndPeriod("daily", day);
  if (existing) {
    let open = false;
    try {
      open = await isNotebookDayQuizWindowOpen(day, options?.now ?? new Date());
    } catch {
      open = false;
    }
    const wantsRewrite = Boolean(options?.force || options?.refresh);
    if (!open || !wantsRewrite) {
      return { status: "skipped", reason: ptBR.summary.dailyAlreadyExists(day) };
    }
  }

  if (!(await dayHasSummaryInput(day))) {
    return {
      status: "skipped",
      reason: DAILY_SUMMARY_NO_INPUT_MESSAGE
    };
  }

  if (!hasLlmApiKey()) {
    return missingApiKeyResult();
  }

  try {
    const context = await buildPersistedDailySummaryContext(day);
    const prompt = buildPersistedDailySummaryPrompt(context);
    const content = await generateLlmText(prompt);
    const summary = await saveSummary({ type: "daily", periodKey: day, content });
    return { status: "ok", summary };
  } catch (error) {
    return mapGenerationError(error);
  }
}

export async function generateAndPersistWeeklySummary(
  weekMonday: string,
  options?: { force?: boolean }
): Promise<SummaryGenerationResult> {
  if (!isValidNotebookDay(weekMonday)) {
    return { status: "error", message: ptBR.summary.invalidWeekMonday };
  }

  if (!options?.force) {
    const existing = await getSummaryByTypeAndPeriod("weekly", weekMonday);
    if (existing) {
      return { status: "skipped", reason: ptBR.summary.weeklyAlreadyExists(weekMonday) };
    }
  }

  if (!(await weekHasSummaryInput(weekMonday))) {
    return {
      status: "skipped",
      reason: WEEKLY_SUMMARY_NO_INPUT_MESSAGE
    };
  }

  if (!hasLlmApiKey()) {
    return missingApiKeyResult();
  }

  try {
    const context = await buildWeeklySummaryContext(weekMonday);
    const prompt = buildWeeklySummaryPrompt(context);
    const content = await generateLlmText(prompt);
    const summary = await saveSummary({ type: "weekly", periodKey: weekMonday, content });
    return { status: "ok", summary };
  } catch (error) {
    return mapGenerationError(error);
  }
}

function mapGenerationError(error: unknown): SummaryGenerationResult {
  if (error instanceof GeminiConfigError) {
    return { status: "missing_api_key", message: error.message };
  }
  if (error instanceof GeminiRateLimitError) {
    return {
      status: "rate_limited",
      message: error.message || GEMINI_RATE_LIMIT_USER_MESSAGE
    };
  }
  if (error instanceof GeminiGenerationError) {
    return { status: "error", message: error.message };
  }
  const message = error instanceof Error ? error.message : ptBR.summary.generationFailed;
  return { status: "error", message };
}
