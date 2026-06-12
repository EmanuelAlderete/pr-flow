import { beforeEach, describe, expect, it, vi } from "vitest";

const hasJiraCache = vi.fn();
const loadJiraSprintsCache = vi.fn();
const loadJiraIssuesCache = vi.fn();
const loadJiraIssueDetail = vi.fn();

vi.mock("@/modules/jira/lib/jira-cache-repository", () => ({
  hasJiraCache: (...args: unknown[]) => hasJiraCache(...args),
  loadJiraSprintsCache: (...args: unknown[]) => loadJiraSprintsCache(...args),
  loadJiraIssuesCache: (...args: unknown[]) => loadJiraIssuesCache(...args),
  loadJiraIssueDetail: (...args: unknown[]) => loadJiraIssueDetail(...args)
}));

describe("buildDailySummaryJiraContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cache is not ready", async () => {
    hasJiraCache.mockResolvedValue(false);
    const { buildDailySummaryJiraContext } = await import(
      "@/modules/dashboard/lib/daily-summary-jira-context"
    );
    expect(await buildDailySummaryJiraContext("2026-05-28")).toBeNull();
  });

  it("maps issues with detail and flags updated on notebook day", async () => {
    hasJiraCache.mockResolvedValue(true);
    loadJiraSprintsCache.mockResolvedValue({
      boardId: 1,
      boardName: "Board",
      projectKey: "PROJ",
      sprints: [{ id: 10, name: "Sprint Ativa", state: "active", startDate: null, endDate: null }],
      cachedAt: null
    });
    loadJiraIssuesCache.mockResolvedValue({
      issues: [
        {
          key: "PROJ-1",
          summary: "Implementar API",
          statusName: "Em progresso",
          statusCategoryKey: "indeterminate",
          issueTypeName: "Story",
          priorityName: "Medium",
          updated: "2026-05-28T18:00:00.000Z",
          browseUrl: "https://jira/PROJ-1"
        },
        {
          key: "PROJ-2",
          summary: "Doc antiga",
          statusName: "Concluído",
          statusCategoryKey: "done",
          issueTypeName: "Task",
          priorityName: null,
          updated: "2026-05-20T10:00:00.000Z",
          browseUrl: "https://jira/PROJ-2"
        }
      ],
      cachedAt: null
    });
    loadJiraIssueDetail.mockImplementation(async (key: string) => {
      if (key === "PROJ-1") {
        return {
          key: "PROJ-1",
          summary: "Implementar API",
          description: null,
          figmaUrls: [],
          hours: "Gasto: 3h · Restante: 1h",
          timeProgress: {
            estimateSeconds: 14400,
            spentSeconds: 10800,
            remainingSeconds: 3600,
            estimateLabel: "4h",
            spentLabel: "3h",
            remainingLabel: "1h",
            percent: 75
          },
          latestComment: null,
          browseUrl: "https://jira/PROJ-1",
          cachedAt: null
        };
      }
      return null;
    });

    const { buildDailySummaryJiraContext, jiraContextHasActivityOnDay } = await import(
      "@/modules/dashboard/lib/daily-summary-jira-context"
    );
    const context = await buildDailySummaryJiraContext("2026-05-28");

    expect(loadJiraIssuesCache).toHaveBeenCalledWith("10");
    expect(context?.sprintLabel).toBe("Sprint Ativa");
    expect(context?.issues[0]?.key).toBe("PROJ-1");
    expect(context?.issues[0]?.updatedOnDay).toBe(true);
    expect(context?.issues[0]?.hours).toContain("Gasto");
    expect(context?.issues[1]?.updatedOnDay).toBe(false);
    expect(jiraContextHasActivityOnDay(context)).toBe(true);
  });
});
