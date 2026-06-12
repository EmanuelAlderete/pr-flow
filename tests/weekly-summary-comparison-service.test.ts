import { describe, expect, it, vi, beforeEach } from "vitest";

const buildWeeklySummaryContext = vi.fn();

vi.mock("@/modules/summaries/lib/weekly-summary-context", () => ({
  buildWeeklySummaryContext: (...args: unknown[]) => buildWeeklySummaryContext(...args)
}));

describe("getWeeklyComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna métricas comparativas entre semana atual e anterior", async () => {
    buildWeeklySummaryContext.mockResolvedValueOnce({
      weekMonday: "2026-05-18",
      days: [{ day: "2026-05-18" }],
      totals: {
        reviewsGiven: 4,
        reviewsReceived: 1,
        tasksCompleted: 3,
        jiraTicketsMoved: 2,
        jiraTicketsClosed: 1,
        jiraTicketsStillOpen: 1,
        prsMerged: 2,
        activeDays: 3,
        openPrsOnLastDay: 0
      },
      previousWeekTotals: {
        reviewsGiven: 2,
        reviewsReceived: 2,
        tasksCompleted: 5,
        jiraTicketsMoved: 4,
        jiraTicketsClosed: 2,
        jiraTicketsStillOpen: 2,
        prsMerged: 1,
        activeDays: 4,
        openPrsOnLastDay: 1
      },
      comparisonDeltas: [
        {
          metric: "Reviews realizados",
          current: 4,
          previous: 2,
          delta: 2
        }
      ],
      activityByDay: [{ day: "2026-05-18", score: 2 }],
      carryOver: { pendingTasks: [] },
      previousWeekSummary: "Resumo antigo"
    });

    vi.resetModules();
    const { getWeeklyComparison } = await import(
      "@/modules/summaries/lib/weekly-summary-comparison-service"
    );
    const result = await getWeeklyComparison("2026-05-18");

    expect(buildWeeklySummaryContext).toHaveBeenCalledTimes(1);
    expect(result.weekMonday).toBe("2026-05-18");
    expect(result.previousWeekMonday).toBe("2026-05-11");
    expect(result.hasPreviousWeekSummary).toBe(true);
    expect(result.deltas.find((item) => item.metric === "Reviews realizados")?.delta).toBe(2);
  });
});
