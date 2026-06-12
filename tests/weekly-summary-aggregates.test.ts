import { describe, expect, it } from "vitest";
import type { WeeklyDaySnapshot } from "@/modules/summaries/lib/weekly-summary-context";
import {
  computeWeeklyActivityByDay,
  computeWeeklyCarryOver,
  computeWeeklyTotals
} from "@/modules/summaries/lib/weekly-summary-aggregates";

function daySnapshot(
  day: string,
  overrides: Partial<WeeklyDaySnapshot["context"]> = {}
): WeeklyDaySnapshot {
  return {
    day,
    persistedSummary: null,
    context: {
      day,
      noteBody: null,
      pendingTasks: [],
      completedTodayTasks: [],
      jira: null,
      prs: null,
      ...overrides
    }
  };
}

describe("computeWeeklyTotals", () => {
  it("agrega reviews, tarefas concluídas e tickets Jira movimentados na semana", () => {
    const days: WeeklyDaySnapshot[] = [
      daySnapshot("2026-05-18", {
        completedTodayTasks: [{ title: "Task A", description: null, dueDate: null }],
        jira: {
          sprintLabel: "Sprint 1",
          issues: [
            {
              key: "JOR-1",
              summary: "API",
              statusName: "Done",
              statusCategoryKey: "done",
              issueTypeName: "Story",
              priorityName: null,
              updated: "2026-05-18T12:00:00.000Z",
              updatedOnDay: true,
              hours: null,
              timeSpentLabel: null,
              estimateLabel: null,
              percentSpent: null
            }
          ]
        },
        prs: {
          githubLogin: "dev",
          syncedAt: null,
          myOpenPrs: [],
          reviewsGivenToday: [
            {
              prNumber: 1,
              prTitle: "PR 1",
              repository: "acme/repo",
              state: "APPROVED",
              submittedAt: "2026-05-18T10:00:00.000Z",
              jiraIssueKey: null
            }
          ],
          reviewsReceivedToday: [],
          pendingReviews: [],
          statusChangesToday: [],
          mergesToday: [
            {
              prNumber: 10,
              prTitle: "Merged PR",
              repository: "acme/repo",
              occurredAt: "2026-05-18T16:00:00.000Z",
              jiraIssueKey: null
            }
          ]
        }
      }),
      daySnapshot("2026-05-19", {
        jira: {
          sprintLabel: "Sprint 1",
          issues: [
            {
              key: "JOR-2",
              summary: "UI",
              statusName: "Em progresso",
              statusCategoryKey: "indeterminate",
              issueTypeName: "Story",
              priorityName: null,
              updated: "2026-05-19T12:00:00.000Z",
              updatedOnDay: true,
              hours: null,
              timeSpentLabel: null,
              estimateLabel: null,
              percentSpent: null
            }
          ]
        },
        prs: {
          githubLogin: "dev",
          syncedAt: null,
          myOpenPrs: [],
          reviewsGivenToday: [],
          reviewsReceivedToday: [
            {
              prNumber: 2,
              prTitle: "PR 2",
              repository: "acme/repo",
              reviewerLogin: "alice",
              state: "APPROVED",
              submittedAt: "2026-05-19T15:00:00.000Z",
              jiraIssueKey: null
            }
          ],
          pendingReviews: [],
          statusChangesToday: [],
          mergesToday: []
        }
      })
    ];

    const totals = computeWeeklyTotals(days);

    expect(totals.reviewsGiven).toBe(1);
    expect(totals.reviewsReceived).toBe(1);
    expect(totals.tasksCompleted).toBe(1);
    expect(totals.jiraTicketsMoved).toBe(2);
    expect(totals.jiraTicketsClosed).toBe(1);
    expect(totals.jiraTicketsStillOpen).toBe(1);
    expect(totals.prsMerged).toBe(1);
    expect(totals.activeDays).toBe(2);
  });
});

describe("computeWeeklyCarryOver", () => {
  it("lista tarefas pendentes no último dia com dados da semana", () => {
    const days: WeeklyDaySnapshot[] = [
      daySnapshot("2026-05-23", {
        pendingTasks: [{ title: "Deploy", description: null, dueDate: null, isOverdue: true }]
      }),
      daySnapshot("2026-05-24", {
        pendingTasks: [
          { title: "Deploy", description: null, dueDate: null, isOverdue: true },
          { title: "Docs", description: null, dueDate: null }
        ]
      })
    ];

    const carryOver = computeWeeklyCarryOver(days, "2026-05-24");

    expect(carryOver.pendingTasks).toEqual([
      { title: "Deploy", isOverdue: true },
      { title: "Docs", isOverdue: false }
    ]);
  });
});

describe("computeWeeklyActivityByDay", () => {
  it("retorna pontuação de atividade por dia da semana", () => {
    const days: WeeklyDaySnapshot[] = [
      daySnapshot("2026-05-18", {
        noteBody: "Nota",
        completedTodayTasks: [{ title: "A", description: null, dueDate: null }]
      }),
      daySnapshot("2026-05-19")
    ];

    const activity = computeWeeklyActivityByDay(days, "2026-05-18");

    expect(activity).toHaveLength(7);
    expect(activity[0]).toEqual({ day: "2026-05-18", score: 2 });
    expect(activity[1]).toEqual({ day: "2026-05-19", score: 0 });
  });
});
