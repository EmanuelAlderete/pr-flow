import { describe, expect, it } from "vitest";
import { buildDashboardBriefingPrompt } from "@/modules/dashboard/lib/dashboard-briefing-prompt";
import type { DashboardBriefingContext } from "@/modules/dashboard/lib/dashboard-briefing-types";

const emptyPrs = {
  githubLogin: "dev",
  syncedAt: null,
  myOpenPrs: [],
  reviewsGivenToday: [],
  reviewsReceivedToday: [],
  pendingReviews: [],
  statusChangesToday: [],
  mergesToday: []
};

function baseContext(overrides: Partial<DashboardBriefingContext> = {}): DashboardBriefingContext {
  const emptyDay = {
    day: "2026-05-29",
    noteBody: null,
    pendingTasks: [],
    completedTodayTasks: [],
    jira: null,
    prs: emptyPrs
  };

  return {
    today: "2026-06-01",
    previousBusinessDay: "2026-05-29",
    lastWorkdayContext: {
      ...emptyDay,
      day: "2026-05-29",
      completedTodayTasks: [{ title: "Entrega API", description: null, dueDate: null }],
      jira: {
        sprintLabel: "Sprint 10",
        issues: [
          {
            key: "JOR-1",
            summary: "API",
            statusName: "Concluído",
            statusCategoryKey: "done",
            issueTypeName: "Story",
            priorityName: null,
            updated: "2026-05-29T18:00:00.000Z",
            updatedOnDay: true,
            hours: null,
            timeSpentLabel: null,
            estimateLabel: null,
            percentSpent: null
          }
        ]
      }
    },
    todayContext: {
      ...emptyDay,
      day: "2026-06-01",
      pendingTasks: [{ title: "Revisar PR", description: null, dueDate: null }]
    },
    persistedDailySummaryForLastWorkday: null,
    ...overrides
  };
}

describe("buildDashboardBriefingPrompt", () => {
  it("instrui estrutura Mapa de Batalha e referência ao último dia útil", () => {
    const prompt = buildDashboardBriefingPrompt(baseContext());

    expect(prompt).toContain("mapa de batalha imediato");
    expect(prompt).toContain("## 🏁 Fechamento de Ontem");
    expect(prompt).toContain("## 🚨 Desbloqueios Urgentes");
    expect(prompt).toContain("## 🎯 Foco de Ataque de Hoje");
    expect(prompt).toContain("Status Geral:");
    expect(prompt).toContain("Proibido logs repetitivos");
    expect(prompt).toContain("sem coaching");
    expect(prompt).toContain("2026-05-29");
    expect(prompt).toContain("2026-06-01");
    expect(prompt).toContain("JOR-1");
    expect(prompt).not.toContain("## Motivação");
    expect(prompt).not.toContain("## Ontem por ticket");
    expect(prompt).not.toContain("## Projeção para hoje");
  });

  it("destaca segunda-feira e sexta como último dia útil", () => {
    const prompt = buildDashboardBriefingPrompt(baseContext());

    expect(prompt).toContain("segunda-feira");
    expect(prompt).toContain("sexta");
  });
});
