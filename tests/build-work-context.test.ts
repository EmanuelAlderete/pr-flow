import { beforeEach, describe, expect, it, vi } from "vitest";

const loadJiraIssueDetail = vi.fn();
const findJiraIssueInCache = vi.fn();
const loadWorkContextPullRequests = vi.fn();
const loadWorkContextTasks = vi.fn();
const loadWorkContextJournalMentions = vi.fn();

vi.mock("@/modules/jira/lib/jira-cache-repository", () => ({
  loadJiraIssueDetail: (...args: unknown[]) => loadJiraIssueDetail(...args),
  findJiraIssueInCache: (...args: unknown[]) => findJiraIssueInCache(...args)
}));

vi.mock("@/modules/work-context/lib/work-context-pull-requests", () => ({
  loadWorkContextPullRequests: (...args: unknown[]) => loadWorkContextPullRequests(...args)
}));

vi.mock("@/modules/work-context/lib/work-context-tasks", () => ({
  loadWorkContextTasks: (...args: unknown[]) => loadWorkContextTasks(...args)
}));

vi.mock("@/modules/work-context/lib/work-context-journal", () => ({
  loadWorkContextJournalMentions: (...args: unknown[]) => loadWorkContextJournalMentions(...args)
}));

describe("buildWorkContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrega ticket, PRs, tasks e menções do journal para a chave", async () => {
    findJiraIssueInCache.mockResolvedValue({
      key: "JOR-123",
      summary: "Feature X",
      statusName: "Em progresso",
      statusCategoryKey: "indeterminate",
      issueTypeName: "Story",
      priorityName: null,
      updated: "2026-05-28T10:00:00.000Z",
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-123"
    });
    loadJiraIssueDetail.mockResolvedValue({
      key: "JOR-123",
      summary: "Feature X",
      description: null,
      figmaUrls: [],
      hours: null,
      timeProgress: null,
      latestComment: null,
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-123",
      cachedAt: "2026-05-28T10:00:00.000Z"
    });
    loadWorkContextPullRequests.mockResolvedValue([
      {
        number: 42,
        title: "JOR-123 Feature X",
        repository: "acme/repo",
        url: "https://github.com/acme/repo/pull/42",
        statusGeral: "pending_review"
      }
    ]);
    loadWorkContextTasks.mockResolvedValue([
      {
        id: "task-1",
        title: "[JOR-123] Implementar",
        completed: false
      }
    ]);
    loadWorkContextJournalMentions.mockResolvedValue([
      {
        notebookDay: "2026-05-28",
        excerpt: "Pair no JOR-123"
      }
    ]);

    const { buildWorkContext } = await import("@/modules/work-context/lib/build-work-context");
    const context = await buildWorkContext("jor-123");

    expect(context.issueKey).toBe("JOR-123");
    expect(context.jira.summary?.key).toBe("JOR-123");
    expect(context.pullRequests).toHaveLength(1);
    expect(context.pullRequests[0]?.number).toBe(42);
    expect(context.tasks).toHaveLength(1);
    expect(context.journalMentions).toHaveLength(1);
    expect(context.gaps).toHaveLength(0);
    expect(loadWorkContextPullRequests).toHaveBeenCalledWith("JOR-123");
    expect(loadWorkContextTasks).toHaveBeenCalledWith("JOR-123");
    expect(loadWorkContextJournalMentions).toHaveBeenCalledWith("JOR-123");
  });
});
