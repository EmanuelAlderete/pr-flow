import { beforeEach, describe, expect, it, vi } from "vitest";

const getActiveNoteByNotebookDay = vi.fn();
const hasTasksCompletedOnNotebookDay = vi.fn();
const buildDailySummaryJiraContext = vi.fn();
const buildDailySummaryPrContext = vi.fn();
const buildGitActivityForDay = vi.fn();

vi.mock("@/modules/journal/lib/note-repository", () => ({
  getActiveNoteByNotebookDay: (...args: unknown[]) => getActiveNoteByNotebookDay(...args)
}));

vi.mock("@/modules/tasks/lib/task-repository", () => ({
  hasTasksCompletedOnNotebookDay: (...args: unknown[]) => hasTasksCompletedOnNotebookDay(...args)
}));

vi.mock("@/modules/notebook-day/lib/jira-context", () => ({
  buildDailySummaryJiraContext: (...args: unknown[]) => buildDailySummaryJiraContext(...args),
  jiraContextHasActivityOnDay: (jira: { issues: { updatedOnDay: boolean }[] } | null) =>
    Boolean(jira?.issues.some((issue) => issue.updatedOnDay))
}));

vi.mock("@/modules/notebook-day/lib/pr-context", () => ({
  buildDailySummaryPrContext: (...args: unknown[]) => buildDailySummaryPrContext(...args),
  prContextHasSummaryInput: (prs: {
    reviewsGivenToday: unknown[];
    reviewsReceivedToday: unknown[];
    statusChangesToday?: unknown[];
    mergesToday?: unknown[];
  } | null) =>
    Boolean(
      prs &&
        (prs.reviewsGivenToday.length > 0 ||
          prs.reviewsReceivedToday.length > 0 ||
          (prs.statusChangesToday?.length ?? 0) > 0 ||
          (prs.mergesToday?.length ?? 0) > 0)
    )
}));

vi.mock("@/modules/notebook-day/lib/git-activity", () => ({
  buildGitActivityForDay: (...args: unknown[]) => buildGitActivityForDay(...args)
}));

describe("summary-input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildGitActivityForDay.mockResolvedValue([]);
  });

  it("contextHasSummaryInput ignora tarefas pendentes", async () => {
    const { contextHasSummaryInput } = await import("@/modules/summaries/lib/summary-input");
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: null,
        pendingTasks: [{ title: "Só pendente", description: null, dueDate: null, isOverdue: true }],
        completedTodayTasks: [],
        jira: null,
        prs: null
      })
    ).toBe(false);
  });

  it("contextHasSummaryInput aceita anotação ou conclusão no dia", async () => {
    const { contextHasSummaryInput } = await import("@/modules/summaries/lib/summary-input");
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: "  Diário  ",
        pendingTasks: [],
        completedTodayTasks: [],
        jira: null,
        prs: null
      })
    ).toBe(true);
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: null,
        pendingTasks: [],
        completedTodayTasks: [{ title: "Feito", description: null, dueDate: null }],
        jira: null,
        prs: null
      })
    ).toBe(true);
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: null,
        pendingTasks: [],
        completedTodayTasks: [],
        jira: {
          sprintLabel: "Sprint 1",
          issues: [
            {
              key: "PROJ-9",
              summary: "Bug",
              statusName: "Em progresso",
              statusCategoryKey: "indeterminate",
              issueTypeName: "Bug",
              priorityName: null,
              updated: "2026-05-20T12:00:00.000Z",
              updatedOnDay: true,
              hours: null,
              timeSpentLabel: null,
              estimateLabel: null,
              percentSpent: null
            }
          ]
        },
        prs: null
      })
    ).toBe(true);
  });

  it("contextHasSummaryInput aceita review de PR no dia", async () => {
    const { contextHasSummaryInput } = await import("@/modules/summaries/lib/summary-input");
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: null,
        pendingTasks: [],
        completedTodayTasks: [],
        jira: null,
        prs: {
          githubLogin: "rigon",
          syncedAt: null,
          myOpenPrs: [],
          reviewsGivenToday: [
            {
              prNumber: 1,
              prTitle: "Fix",
              repository: "acme/repo",
              state: "APPROVED",
              submittedAt: "2026-05-20T12:00:00.000Z",
              jiraIssueKey: null
            }
          ],
          reviewsReceivedToday: [],
          pendingReviews: [],
          statusChangesToday: [],
          mergesToday: []
        }
      })
    ).toBe(true);
  });

  it("contextHasSummaryInput aceita merge ou mudança de status", async () => {
    const { contextHasSummaryInput } = await import("@/modules/summaries/lib/summary-input");
    expect(
      contextHasSummaryInput({
        day: "2026-05-20",
        noteBody: null,
        pendingTasks: [],
        completedTodayTasks: [],
        jira: null,
        prs: {
          githubLogin: "rigon",
          syncedAt: null,
          myOpenPrs: [],
          reviewsGivenToday: [],
          reviewsReceivedToday: [],
          pendingReviews: [],
          statusChangesToday: [
            {
              prNumber: 1,
              prTitle: "Feat",
              repository: "acme/repo",
              previousStatus: "pending_review",
              nextStatus: "approved",
              occurredAt: "2026-05-20T12:00:00.000Z",
              jiraIssueKey: null
            }
          ],
          mergesToday: []
        }
      })
    ).toBe(true);
  });

  it("dayHasSummaryInput consulta nota, tarefas, jira e prs do dia", async () => {
    getActiveNoteByNotebookDay.mockResolvedValue(null);
    hasTasksCompletedOnNotebookDay.mockResolvedValue(false);
    buildDailySummaryJiraContext.mockResolvedValue({ sprintLabel: null, issues: [] });
    buildDailySummaryPrContext.mockResolvedValue({
      githubLogin: "rigon",
      syncedAt: null,
      myOpenPrs: [],
      reviewsGivenToday: [],
      reviewsReceivedToday: [],
      pendingReviews: [],
      statusChangesToday: [],
      mergesToday: []
    });

    const { dayHasSummaryInput } = await import("@/modules/summaries/lib/summary-input");
    expect(await dayHasSummaryInput("2026-05-14")).toBe(false);

    hasTasksCompletedOnNotebookDay.mockResolvedValue(true);
    expect(await dayHasSummaryInput("2026-05-14")).toBe(true);

    hasTasksCompletedOnNotebookDay.mockResolvedValue(false);
    buildDailySummaryJiraContext.mockResolvedValue({
      sprintLabel: "Sprint",
      issues: [{ updatedOnDay: true }]
    });
    expect(await dayHasSummaryInput("2026-05-14")).toBe(true);

    buildDailySummaryJiraContext.mockResolvedValue({ sprintLabel: null, issues: [] });
    buildDailySummaryPrContext.mockResolvedValue({
      githubLogin: "rigon",
      syncedAt: null,
      myOpenPrs: [],
      reviewsGivenToday: [{ prNumber: 1, prTitle: "x", repository: "a/b", state: "APPROVED", submittedAt: "x", jiraIssueKey: null }],
      reviewsReceivedToday: [],
      pendingReviews: []
    });
    expect(await dayHasSummaryInput("2026-05-14")).toBe(true);
  });
});
