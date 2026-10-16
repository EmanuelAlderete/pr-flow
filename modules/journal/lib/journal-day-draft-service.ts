import {
  normalizeJournalDayDraft,
  type JournalDayDraftResponse
} from "@/modules/journal/lib/journal-day-draft";
import { buildJournalDayDraftPrompt } from "@/modules/journal/lib/journal-day-draft-prompt";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";
import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  generateLlmText,
  hasLlmApiKey
} from "@/modules/llm-generation";
import { ptBR } from "@/modules/messages";
import { buildNotebookDayContext, contextHasSummaryInput } from "@/modules/notebook-day";

function mapGenerationError(error: unknown): JournalDayDraftResponse {
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
  const message = error instanceof Error ? error.message : ptBR.journalDayDraft.failed;
  return { status: "error", message };
}

export async function generateJournalDayDraft(notebookDay: string): Promise<JournalDayDraftResponse> {
  if (!isValidNotebookDay(notebookDay)) {
    return { status: "error", message: ptBR.journalDayDraft.invalidDate };
  }

  if (!hasLlmApiKey()) {
    return { status: "missing_api_key", message: ptBR.journalDayDraft.missingApiKey };
  }

  const context = await buildNotebookDayContext(notebookDay);
  if (!contextHasSummaryInput(context)) {
    return {
      status: "no_input",
      day: notebookDay,
      message: ptBR.journalDayDraft.noInput
    };
  }

  try {
    const draft = normalizeJournalDayDraft(await generateLlmText(buildJournalDayDraftPrompt(context)));
    if (!draft) {
      return { status: "error", message: ptBR.journalDayDraft.failed };
    }
    return { status: "ok", day: notebookDay, draft };
  } catch (error) {
    return mapGenerationError(error);
  }
}
