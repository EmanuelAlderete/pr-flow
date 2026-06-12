import { afterEach, describe, expect, it } from "vitest";
import {
  clearDashboardBriefingCache,
  clearDashboardHubStatsCache,
  DASHBOARD_WIDGET_CACHE_TTL_MS,
  loadDashboardBriefingCache,
  loadDashboardHubStatsCache,
  saveDashboardBriefingCache,
  saveDashboardHubStatsCache
} from "@/modules/dashboard/lib/dashboard-widget-cache";

describe("dashboard-widget-cache", () => {
  afterEach(() => {
    clearDashboardHubStatsCache();
    clearDashboardBriefingCache("2026-06-01");
    sessionStorage.clear();
  });

  it("salva e carrega stats do hub", () => {
    saveDashboardHubStatsCache({
      openPrs: 2,
      openTasks: 1,
      overdueTasks: 0,
      pendingReviews: 3,
      jiraSprintTickets: 4,
      jiraSprintLabel: "Sprint 12"
    });

    expect(loadDashboardHubStatsCache()).toEqual({
      openPrs: 2,
      openTasks: 1,
      overdueTasks: 0,
      pendingReviews: 3,
      jiraSprintTickets: 4,
      jiraSprintLabel: "Sprint 12"
    });
  });

  it("rejeita cache antigo sem pendingReviews", () => {
    sessionStorage.setItem(
      "pr-flow:dashboard-hub-stats-v1",
      JSON.stringify({
        value: {
          openPrs: 2,
          openTasks: 1,
          overdueTasks: 0,
          jiraSprintTickets: 4,
          jiraSprintLabel: "Sprint 12"
        },
        cachedAt: Date.now()
      })
    );

    expect(loadDashboardHubStatsCache()).toBeNull();
  });

  it("expira cache após o TTL", () => {
    saveDashboardHubStatsCache({
      openPrs: 1,
      openTasks: 1,
      overdueTasks: 0,
      pendingReviews: 0,
      jiraSprintTickets: 1,
      jiraSprintLabel: null
    });

    const raw = sessionStorage.getItem("pr-flow:dashboard-hub-stats-v1");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(String(raw)) as { cachedAt: number };
    parsed.cachedAt = Date.now() - DASHBOARD_WIDGET_CACHE_TTL_MS - 1;
    sessionStorage.setItem("pr-flow:dashboard-hub-stats-v1", JSON.stringify(parsed));

    expect(loadDashboardHubStatsCache()).toBeNull();
  });

  it("carrega briefing gravado na chave legada do sessionStorage", () => {
    sessionStorage.setItem(
      "pr-flow:dashboard-daily-summary-v1:2026-06-01",
      JSON.stringify({
        value: {
          status: "ok",
          day: "2026-06-01",
          previousBusinessDay: "2026-05-29",
          summary: "## Do cache legado",
          generatedAt: "2026-06-01T12:00:00.000Z"
        },
        cachedAt: Date.now()
      })
    );

    expect(loadDashboardBriefingCache("2026-06-01")).toEqual({
      status: "ok",
      day: "2026-06-01",
      previousBusinessDay: "2026-05-29",
      summary: "## Do cache legado",
      generatedAt: "2026-06-01T12:00:00.000Z"
    });
  });

  it("persiste apenas respostas cacheáveis do briefing", () => {
    saveDashboardBriefingCache("2026-06-01", {
      status: "ok",
      day: "2026-06-01",
      previousBusinessDay: "2026-05-29",
      summary: "## Projeção para hoje",
      generatedAt: "2026-06-01T12:00:00.000Z"
    });
    saveDashboardBriefingCache("2026-06-01", {
      status: "error",
      message: "falhou"
    });

    expect(loadDashboardBriefingCache("2026-06-01")).toEqual({
      status: "ok",
      day: "2026-06-01",
      previousBusinessDay: "2026-05-29",
      summary: "## Projeção para hoje",
      generatedAt: "2026-06-01T12:00:00.000Z"
    });
  });
});
