import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";
import { buildDashboardBriefingContext } from "@/modules/dashboard/lib/dashboard-briefing-context";
import {
  DASHBOARD_BRIEFING_NO_INPUT_MESSAGE,
  dashboardBriefingHasInput
} from "@/modules/dashboard/lib/dashboard-briefing-input";
import { buildDashboardBriefingPrompt } from "@/modules/dashboard/lib/dashboard-briefing-prompt";
import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  generateLlmText,
  hasLlmApiKey
} from "@/modules/llm-generation";
import { isValidNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { ptBR } from "@/modules/messages";
import { previousBusinessDay } from "@/modules/summaries/lib/summary-period";
import { getSummaryByTypeAndPeriod, saveSummary } from "@/modules/summaries/lib/summary-repository";

function resolveToday(day: string | undefined): string | null {
  const value = day?.trim() || todayLocalDateString();
  return isValidNotebookDay(value) ? value : null;
}

function mapGenerationError(error: unknown): DashboardBriefingResponse {
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
  const message = error instanceof Error ? error.message : ptBR.briefing.generationFailed;
  return { status: "error", message };
}

export async function getDashboardBriefing(dayInput?: string): Promise<DashboardBriefingResponse> {
  const today = resolveToday(dayInput);
  if (!today) {
    return {
      status: "error",
      message: ptBR.briefing.invalidDate
    };
  }

  const existing = await getSummaryByTypeAndPeriod("dashboard", today);
  if (existing) {
    return {
      status: "ok",
      day: today,
      previousBusinessDay: previousBusinessDay(today),
      summary: existing.content,
      generatedAt: existing.generatedAt
    };
  }

  return {
    status: "not_generated",
    day: today,
    previousBusinessDay: previousBusinessDay(today)
  };
}

export async function generateAndPersistDashboardBriefing(
  dayInput?: string
): Promise<DashboardBriefingResponse> {
  const today = resolveToday(dayInput);
  if (!today) {
    return {
      status: "error",
      message: ptBR.briefing.invalidDate
    };
  }

  if (!hasLlmApiKey()) {
    return {
      status: "missing_api_key",
      message: ptBR.briefing.missingApiKey
    };
  }

  const context = await buildDashboardBriefingContext(today);
  if (!dashboardBriefingHasInput(context)) {
    return {
      status: "no_input",
      day: today,
      message: DASHBOARD_BRIEFING_NO_INPUT_MESSAGE
    };
  }

  try {
    const prompt = buildDashboardBriefingPrompt(context);
    const content = await generateLlmText(prompt);
    const summary = await saveSummary({ type: "dashboard", periodKey: today, content });
    return {
      status: "ok",
      day: today,
      previousBusinessDay: context.previousBusinessDay,
      summary: summary.content,
      generatedAt: summary.generatedAt
    };
  } catch (error) {
    return mapGenerationError(error);
  }
}
