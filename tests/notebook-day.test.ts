import { beforeEach, describe, expect, it, vi } from "vitest";

const getActiveNoteByNotebookDay = vi.fn();
const listTaskLists = vi.fn();
const buildDailySummaryJiraContext = vi.fn();
const buildDailySummaryPrContext = vi.fn();

vi.mock("@/modules/journal/lib/note-repository", () => ({
  getActiveNoteByNotebookDay: (...args: unknown[]) => getActiveNoteByNotebookDay(...args)
}));

vi.mock("@/modules/tasks/lib/task-repository", () => ({
  listTaskLists: (...args: unknown[]) => listTaskLists(...args)
}));

vi.mock("@/modules/notebook-day/lib/jira-context", () => ({
  buildDailySummaryJiraContext: (...args: unknown[]) => buildDailySummaryJiraContext(...args),
  jiraContextHasActivityOnDay: (jira: { issues: { updatedOnDay: boolean }[] } | null) =>
    Boolean(jira?.issues.some((issue) => issue.updatedOnDay))
}));

vi.mock("@/modules/notebook-day/lib/pr-context", () => ({
  buildDailySummaryPrContext: (...args: unknown[]) => buildDailySummaryPrContext(...args),
  prContextHasSummaryInput: (prs: { reviewsGivenToday: unknown[] } | null) =>
    Boolean(prs && prs.reviewsGivenToday.length > 0)
}));

describe("notebook-day (seam público)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta contexto e detecta insumo via contextHasSummaryInput", async () => {
    getActiveNoteByNotebookDay.mockResolvedValue({
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "Release",
      createdAt: "2026-05-28T08:00:00.000Z",
      updatedAt: "2026-05-28T08:00:00.000Z"
    });

    listTaskLists.mockResolvedValue({ open: [], completed: [] });
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

    const { buildNotebookDayContext, contextHasSummaryInput } = await import("@/modules/notebook-day");

    const context = await buildNotebookDayContext("2026-05-28");

    expect(context.day).toBe("2026-05-28");
    expect(context.noteBody).toBe("Release");
    expect(contextHasSummaryInput(context)).toBe(true);
  });
});
