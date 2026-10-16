import { beforeEach, describe, expect, it, vi } from "vitest";

const buildNotebookDayContext = vi.fn();
const generateLlmText = vi.fn();
const hasLlmApiKey = vi.fn();

vi.mock("@/modules/notebook-day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/notebook-day")>();
  return {
    ...actual,
    buildNotebookDayContext: (...args: unknown[]) => buildNotebookDayContext(...args)
  };
});

vi.mock("@/modules/llm-generation", () => ({
  generateLlmText: (...args: unknown[]) => generateLlmText(...args),
  hasLlmApiKey: () => hasLlmApiKey(),
  GeminiConfigError: class GeminiConfigError extends Error {},
  GeminiGenerationError: class GeminiGenerationError extends Error {},
  GeminiRateLimitError: class GeminiRateLimitError extends Error {},
  GEMINI_RATE_LIMIT_USER_MESSAGE: "limite"
}));

const dayWithDelivery = {
  day: "2026-05-28",
  noteBody: null,
  pendingTasks: [],
  completedTodayTasks: [{ title: "Entregar API", description: null, dueDate: null }],
  jira: null,
  prs: null
};

describe("generateJournalDayDraft", () => {
  beforeEach(() => {
    vi.resetModules();
    buildNotebookDayContext.mockReset();
    generateLlmText.mockReset();
    hasLlmApiKey.mockReset();
    hasLlmApiKey.mockReturnValue(true);
  });

  it("returns a draft from the day's work", async () => {
    buildNotebookDayContext.mockResolvedValue(dayWithDelivery);
    generateLlmText.mockResolvedValue("## Feito\n- avancei a API\n\n## Entregue\n- API\n\n## Perguntas\n- O que faltou?\n> ");

    const { generateJournalDayDraft } = await import(
      "@/modules/journal/lib/journal-day-draft-service"
    );
    const result = await generateJournalDayDraft("2026-05-28");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.draft).toContain("## Entregue");
      expect(result.day).toBe("2026-05-28");
    }
    expect(generateLlmText).toHaveBeenCalledWith(expect.stringContaining("Entregar API"));
  });

  it("does not call the model when the day has no work to draft from", async () => {
    buildNotebookDayContext.mockResolvedValue({
      ...dayWithDelivery,
      completedTodayTasks: []
    });

    const { generateJournalDayDraft } = await import(
      "@/modules/journal/lib/journal-day-draft-service"
    );
    const result = await generateJournalDayDraft("2026-05-28");

    expect(result.status).toBe("no_input");
    expect(generateLlmText).not.toHaveBeenCalled();
  });

  it("reports a missing API key before reading the day", async () => {
    hasLlmApiKey.mockReturnValue(false);

    const { generateJournalDayDraft } = await import(
      "@/modules/journal/lib/journal-day-draft-service"
    );
    const result = await generateJournalDayDraft("2026-05-28");

    expect(result.status).toBe("missing_api_key");
    expect(buildNotebookDayContext).not.toHaveBeenCalled();
  });
});
