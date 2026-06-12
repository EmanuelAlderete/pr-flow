import { describe, expect, it } from "vitest";
import { buildWeeklyComparisonDeltas } from "@/modules/summaries/lib/weekly-summary-aggregates";

describe("buildWeeklyComparisonDeltas", () => {
  it("calcula delta entre semanas quando há dados anteriores", () => {
    const deltas = buildWeeklyComparisonDeltas(
      {
        reviewsGiven: 5,
        reviewsReceived: 2,
        tasksCompleted: 8,
        jiraTicketsMoved: 3,
        jiraTicketsClosed: 2,
        jiraTicketsStillOpen: 1,
        prsMerged: 6,
        activeDays: 4,
        openPrsOnLastDay: 0
      },
      {
        reviewsGiven: 3,
        reviewsReceived: 4,
        tasksCompleted: 6,
        jiraTicketsMoved: 5,
        jiraTicketsClosed: 1,
        jiraTicketsStillOpen: 4,
        prsMerged: 4,
        activeDays: 5,
        openPrsOnLastDay: 2
      }
    );

    expect(deltas.find((item) => item.metric === "Reviews realizados")).toEqual({
      metric: "Reviews realizados",
      current: 5,
      previous: 3,
      delta: 2
    });
  });

  it("retorna lista vazia sem semana anterior", () => {
    expect(buildWeeklyComparisonDeltas(
      {
        reviewsGiven: 1,
        reviewsReceived: 0,
        tasksCompleted: 0,
        jiraTicketsMoved: 0,
        jiraTicketsClosed: 0,
        jiraTicketsStillOpen: 0,
        prsMerged: 0,
        activeDays: 1,
        openPrsOnLastDay: 0
      },
      null
    )).toEqual([]);
  });
});
