import { beforeEach, describe, expect, it, vi } from "vitest";

const buildPersistedDailySummaryContext = vi.fn();
const buildPersistedDailySummaryPrompt = vi.fn();
const buildWeeklySummaryContext = vi.fn();
const buildWeeklySummaryPrompt = vi.fn();
const getSummaryByTypeAndPeriod = vi.fn();
const saveSummary = vi.fn();
const generateLlmText = vi.fn();
const hasLlmApiKey = vi.fn();
const dayHasSummaryInput = vi.fn();
const weekHasSummaryInput = vi.fn();

vi.mock("@/modules/summaries/lib/persisted-daily-context", () => ({
  buildPersistedDailySummaryContext: (...args: unknown[]) => buildPersistedDailySummaryContext(...args)
}));

vi.mock("@/modules/summaries/lib/persisted-daily-prompt", () => ({
  buildPersistedDailySummaryPrompt: (...args: unknown[]) => buildPersistedDailySummaryPrompt(...args)
}));

vi.mock("@/modules/summaries/lib/weekly-summary-context", () => ({
  buildWeeklySummaryContext: (...args: unknown[]) => buildWeeklySummaryContext(...args)
}));

vi.mock("@/modules/summaries/lib/weekly-summary-prompt", () => ({
  buildWeeklySummaryPrompt: (...args: unknown[]) => buildWeeklySummaryPrompt(...args)
}));

vi.mock("@/modules/summaries/lib/summary-repository", () => ({
  getSummaryByTypeAndPeriod: (...args: unknown[]) => getSummaryByTypeAndPeriod(...args),
  saveSummary: (...args: unknown[]) => saveSummary(...args)
}));

vi.mock("@/modules/summaries/lib/summary-input", () => ({
  dayHasSummaryInput: (...args: unknown[]) => dayHasSummaryInput(...args),
  weekHasSummaryInput: (...args: unknown[]) => weekHasSummaryInput(...args),
  DAILY_SUMMARY_NO_INPUT_MESSAGE: "Sem insumo.",
  WEEKLY_SUMMARY_NO_INPUT_MESSAGE: "Sem insumo na semana."
}));

vi.mock("@/modules/llm-generation", () => ({
  generateLlmText: (...args: unknown[]) => generateLlmText(...args),
  hasLlmApiKey: (...args: unknown[]) => hasLlmApiKey(...args),
  GeminiConfigError: class GeminiConfigError extends Error {},
  GeminiGenerationError: class GeminiGenerationError extends Error {},
  GeminiRateLimitError: class GeminiRateLimitError extends Error {},
  GEMINI_RATE_LIMIT_USER_MESSAGE: "Limite da API Gemini atingido."
}));

describe("generateAndPersistDailySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pula quando não há insumo no dia", async () => {
    getSummaryByTypeAndPeriod.mockResolvedValue(null);
    dayHasSummaryInput.mockResolvedValue(false);

    const { generateAndPersistDailySummary } = await import(
      "@/modules/summaries/lib/summary-generation-service"
    );
    const result = await generateAndPersistDailySummary("2026-05-14");

    expect(result.status).toBe("skipped");
    expect(generateLlmText).not.toHaveBeenCalled();
  });

  it("pula quando resumo diário já existe", async () => {
    getSummaryByTypeAndPeriod.mockResolvedValue({ id: "1" });
    dayHasSummaryInput.mockResolvedValue(true);
    const { generateAndPersistDailySummary } = await import(
      "@/modules/summaries/lib/summary-generation-service"
    );
    const result = await generateAndPersistDailySummary("2026-05-27");
    expect(result.status).toBe("skipped");
    expect(generateLlmText).not.toHaveBeenCalled();
  });

  it("persiste resumo diário gerado", async () => {
    getSummaryByTypeAndPeriod.mockResolvedValue(null);
    dayHasSummaryInput.mockResolvedValue(true);
    hasLlmApiKey.mockReturnValue(true);
    buildPersistedDailySummaryContext.mockResolvedValue({ day: "2026-05-27" });
    buildPersistedDailySummaryPrompt.mockReturnValue("prompt");
    generateLlmText.mockResolvedValue("Resumo do dia");
    saveSummary.mockResolvedValue({
      id: "uuid",
      type: "daily",
      periodKey: "2026-05-27",
      content: "Resumo do dia",
      generatedAt: "2026-05-28T00:00:00.000Z"
    });

    const { generateAndPersistDailySummary } = await import(
      "@/modules/summaries/lib/summary-generation-service"
    );
    const result = await generateAndPersistDailySummary("2026-05-27");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.summary.content).toBe("Resumo do dia");
    }
    expect(saveSummary).toHaveBeenCalledWith({
      type: "daily",
      periodKey: "2026-05-27",
      content: "Resumo do dia"
    });
  });
});

describe("generateAndPersistWeeklySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pula quando resumo semanal já existe (idempotente)", async () => {
    getSummaryByTypeAndPeriod.mockResolvedValue({ id: "weekly-1" });
    weekHasSummaryInput.mockResolvedValue(true);

    const { generateAndPersistWeeklySummary } = await import(
      "@/modules/summaries/lib/summary-generation-service"
    );
    const result = await generateAndPersistWeeklySummary("2026-05-18");

    expect(result.status).toBe("skipped");
    expect(generateLlmText).not.toHaveBeenCalled();
  });
});
