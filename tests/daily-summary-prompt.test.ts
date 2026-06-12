import { describe, expect, it } from "vitest";
import { buildDailySummaryPrompt } from "@/modules/dashboard/lib/daily-summary-prompt";

describe("buildDailySummaryPrompt", () => {
  it("instrui correlação e estrutura markdown com jira", () => {
    const prompt = buildDailySummaryPrompt({
      day: "2026-05-28",
      noteBody: "Foco em PROJ-1",
      pendingTasks: [],
      completedTodayTasks: [{ title: "Revisar PR", description: null, dueDate: null }],
      jira: {
        sprintLabel: "Sprint 10",
        issues: [
          {
            key: "PROJ-1",
            summary: "API",
            statusName: "Em progresso",
            statusCategoryKey: "indeterminate",
            issueTypeName: "Story",
            priorityName: null,
            updated: "2026-05-28T12:00:00.000Z",
            updatedOnDay: true,
            hours: "Gasto: 2h",
            timeSpentLabel: "2h",
            estimateLabel: "4h",
            percentSpent: 50
          }
        ]
      },
      prs: {
        githubLogin: "rigon",
        syncedAt: "2026-05-28T20:00:00.000Z",
        myOpenPrs: [
          {
            number: 42,
            title: "JOR-123 API",
            url: "https://github.com/acme/repo/pull/42",
            repository: "acme/repo",
            statusGeral: "pending_review",
            jiraIssueKey: "JOR-123",
            aprovou: [],
            solicitouAlteracoes: [],
            pendente: ["alice"],
            impediments: []
          }
        ],
        reviewsGivenToday: [],
        reviewsReceivedToday: [],
        pendingReviews: [
          {
            number: 99,
            title: "Outra PR",
            url: "https://github.com/acme/repo/pull/99",
            repository: "acme/repo",
            myReviewStatus: "pending",
            jiraIssueKey: null
          }
        ],
        statusChangesToday: [],
        mergesToday: []
      }
    });

    expect(prompt).toContain("Feedback 3x3");
    expect(prompt).toContain("## 🚀 Entregas (O Impacto)");
    expect(prompt).toContain("## 🎯 Próximos Passos e Desbloqueios");
    expect(prompt).toContain("## 💡 Mentalidade Sênior (Evolução Profissional)");
    expect(prompt).toContain("Não escreva como histórico de logs");
    expect(prompt).toContain("mentor técnico");
    expect(prompt).toContain("PROJ-1");
    expect(prompt).toContain("JOR-123");
    expect(prompt).toContain("correlacionando");
    expect(prompt).toContain("Fila de revisão pendente");
    expect(prompt).not.toContain("## Visão do dia");
    expect(prompt).not.toContain("## Trabalho no Jira");
  });
});
