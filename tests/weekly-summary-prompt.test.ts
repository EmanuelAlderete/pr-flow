import { describe, expect, it } from "vitest";
import { buildWeeklySummaryPrompt } from "@/modules/summaries/lib/weekly-summary-prompt";
import type { WeeklySummaryContext } from "@/modules/summaries/lib/weekly-summary-context";

function minimalContext(overrides: Partial<WeeklySummaryContext> = {}): WeeklySummaryContext {
  return {
    weekMonday: "2026-05-18",
    weekSunday: "2026-05-24",
    days: [
      {
        day: "2026-05-18",
        persistedSummary: null,
        context: {
          day: "2026-05-18",
          noteBody: "Foco em entregas",
          pendingTasks: [],
          completedTodayTasks: [{ title: "Revisar PR", description: null, dueDate: null }],
          jira: null,
          prs: null
        }
      }
    ],
    totals: {
      reviewsGiven: 3,
      reviewsReceived: 2,
      tasksCompleted: 5,
      jiraTicketsMoved: 4,
      jiraTicketsClosed: 2,
      jiraTicketsStillOpen: 2,
      prsMerged: 5,
      activeDays: 4,
      openPrsOnLastDay: 1
    },
    previousWeekTotals: {
      reviewsGiven: 1,
      reviewsReceived: 5,
      tasksCompleted: 3,
      jiraTicketsMoved: 2,
      jiraTicketsClosed: 1,
      jiraTicketsStillOpen: 1,
      prsMerged: 3,
      activeDays: 3,
      openPrsOnLastDay: 2
    },
    comparisonDeltas: [
      {
        metric: "Tickets concluídos",
        current: 2,
        previous: 1,
        delta: 1
      },
      {
        metric: "PRs mescladas",
        current: 5,
        previous: 3,
        delta: 2
      },
      {
        metric: "Reviews realizados",
        current: 3,
        previous: 1,
        delta: 2
      }
    ],
    carryOver: {
      pendingTasks: [{ title: "Deploy produção", isOverdue: true }]
    },
    previousWeekSummary: "## Síntese da semana\nSemana mais leve.",
    activityByDay: [
      { day: "2026-05-18", score: 2 },
      { day: "2026-05-19", score: 0 },
      { day: "2026-05-20", score: 1 },
      { day: "2026-05-21", score: 3 },
      { day: "2026-05-22", score: 0 },
      { day: "2026-05-23", score: 1 },
      { day: "2026-05-24", score: 0 }
    ],
    ...overrides
  };
}

describe("buildWeeklySummaryPrompt", () => {
  it("instrui estrutura Bússola de Tendência com deltas e carry-over", () => {
    const prompt = buildWeeklySummaryPrompt(minimalContext());

    expect(prompt).toContain("Bússola de Tendência");
    expect(prompt).toContain("## 📊 Balanço de Força");
    expect(prompt).toContain("## 🏔️ Grandes Marcos & Entregas");
    expect(prompt).toContain("## 🔍 Padrões Detectados & Riscos de Carreira");
    expect(prompt).toContain("## 📋 O que Cruzou a Fronteira");
    expect(prompt).toContain("tech lead mentor");
    expect(prompt).toContain("Proibido logs repetitivos");
    expect(prompt).toContain("Tickets concluídos: 2");
    expect(prompt).toContain("PRs mescladas: 5");
    expect(prompt).toContain("Reviews realizados: 3");
    expect(prompt).toContain("Deploy produção");
    expect(prompt).toContain("Semana mais leve");
    expect(prompt).toContain("delta: +2");
    expect(prompt).not.toContain("## Destaques da semana");
    expect(prompt).not.toContain("## Pull Requests");
  });

  it("indica ausência de baseline quando não há deltas", () => {
    const prompt = buildWeeklySummaryPrompt(
      minimalContext({
        previousWeekTotals: null,
        comparisonDeltas: [],
        previousWeekSummary: null
      })
    );

    expect(prompt).toContain("métricas da semana anterior indisponíveis");
    expect(prompt).toContain("(resumo da semana anterior não disponível)");
  });
});
