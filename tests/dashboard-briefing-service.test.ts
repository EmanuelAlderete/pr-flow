import { beforeEach, describe, expect, it, vi } from "vitest";

const getSummaryByTypeAndPeriod = vi.fn();
const saveSummary = vi.fn();
const buildDashboardBriefingContext = vi.fn();
const dashboardBriefingHasInput = vi.fn();
const generateLlmText = vi.fn();
const hasLlmApiKey = vi.fn();

vi.mock("@/modules/summaries/lib/summary-repository", () => ({
  getSummaryByTypeAndPeriod: (...args: unknown[]) => getSummaryByTypeAndPeriod(...args),
  saveSummary: (...args: unknown[]) => saveSummary(...args)
}));

vi.mock("@/modules/dashboard/lib/dashboard-briefing-context", () => ({
  buildDashboardBriefingContext: (...args: unknown[]) => buildDashboardBriefingContext(...args)
}));

vi.mock("@/modules/dashboard/lib/dashboard-briefing-input", () => ({
  dashboardBriefingHasInput: (...args: unknown[]) => dashboardBriefingHasInput(...args),
  DASHBOARD_BRIEFING_NO_INPUT_MESSAGE: "sem insumo"
}));

vi.mock("@/modules/dashboard/lib/dashboard-briefing-prompt", () => ({
  buildDashboardBriefingPrompt: () => "prompt"
}));

vi.mock("@/modules/llm-generation", () => ({
  generateLlmText: (...args: unknown[]) => generateLlmText(...args),
  hasLlmApiKey: () => hasLlmApiKey(),
  GeminiConfigError: class GeminiConfigError extends Error {},
  GeminiGenerationError: class GeminiGenerationError extends Error {},
  GeminiRateLimitError: class GeminiRateLimitError extends Error {},
  GEMINI_RATE_LIMIT_USER_MESSAGE: "limite"
}));

describe("dashboard-briefing-service", () => {
  beforeEach(() => {
    vi.resetModules();
    getSummaryByTypeAndPeriod.mockReset();
    saveSummary.mockReset();
    buildDashboardBriefingContext.mockReset();
    dashboardBriefingHasInput.mockReset();
    generateLlmText.mockReset();
    hasLlmApiKey.mockReset();
    hasLlmApiKey.mockReturnValue(true);
  });

  describe("getDashboardBriefing", () => {
    it("retorna briefing existente", async () => {
      getSummaryByTypeAndPeriod.mockResolvedValue({
        content: "## Motivação\nBom trabalho.",
        generatedAt: "2026-06-01T12:00:00.000Z"
      });

      const { getDashboardBriefing } = await import(
        "@/modules/dashboard/lib/dashboard-briefing-service"
      );
      const result = await getDashboardBriefing("2026-06-01");

      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.summary).toContain("Motivação");
        expect(result.previousBusinessDay).toBe("2026-05-29");
      }
    });
  });

  describe("generateAndPersistDashboardBriefing", () => {
    it("persiste briefing quando há insumo", async () => {
      buildDashboardBriefingContext.mockResolvedValue({
        today: "2026-06-01",
        previousBusinessDay: "2026-05-29"
      });
      dashboardBriefingHasInput.mockReturnValue(true);
      generateLlmText.mockResolvedValue("## Ontem por ticket\n...");
      saveSummary.mockResolvedValue({
        content: "## Ontem por ticket\n...",
        generatedAt: "2026-06-01T13:00:00.000Z"
      });

      const { generateAndPersistDashboardBriefing } = await import(
        "@/modules/dashboard/lib/dashboard-briefing-service"
      );
      const result = await generateAndPersistDashboardBriefing("2026-06-01");

      expect(result.status).toBe("ok");
      expect(saveSummary).toHaveBeenCalledWith(
        expect.objectContaining({ type: "dashboard", periodKey: "2026-06-01" })
      );
    });

    it("retorna no_input sem chamar Gemini", async () => {
      buildDashboardBriefingContext.mockResolvedValue({
        today: "2026-06-01",
        previousBusinessDay: "2026-05-29"
      });
      dashboardBriefingHasInput.mockReturnValue(false);

      const { generateAndPersistDashboardBriefing } = await import(
        "@/modules/dashboard/lib/dashboard-briefing-service"
      );
      const result = await generateAndPersistDashboardBriefing("2026-06-01");

      expect(result.status).toBe("no_input");
      expect(generateLlmText).not.toHaveBeenCalled();
    });
  });
});
