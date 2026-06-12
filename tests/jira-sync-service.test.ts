import { afterEach, describe, expect, it, vi } from "vitest";
import * as jiraCacheRepository from "@/modules/jira/lib/jira-cache-repository";
import * as jiraIssueDetailService from "@/modules/jira/lib/jira-issue-detail-service";
import * as jiraService from "@/modules/jira/lib/jira-service";
import * as jiraSprintService from "@/modules/jira/lib/jira-sprint-service";
import { syncJiraCache } from "@/modules/jira/lib/jira-sync-service";

const writeSystemLogFireAndForget = vi.fn();

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: (...args: unknown[]) => writeSystemLogFireAndForget(...args)
}));

describe("syncJiraCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    writeSystemLogFireAndForget.mockClear();
  });

  it("ignora sincronização quando Jira não está configurado", async () => {
    vi.stubEnv("JIRA_EMAIL", "");
    vi.stubEnv("JIRA_TOKEN", "");

    const result = await syncJiraCache();

    expect(result.status).toBe("skipped");
  });

  it("persiste sprints, issues e detalhes no cache", async () => {
    vi.stubEnv("JIRA_EMAIL", "dev@example.com");
    vi.stubEnv("JIRA_TOKEN", "secret");

    vi.spyOn(jiraSprintService, "fetchJiraSprints").mockResolvedValue({
      boardId: 1,
      boardName: "Board",
      projectKey: "JOR",
      sprints: [{ id: 10, name: "Sprint 1", state: "active", startDate: null, endDate: null }],
      cachedAt: null
    });

    vi.spyOn(jiraService, "fetchAssignedJiraIssues").mockImplementation(async ({ sprintFilter }) => ({
      email: "dev@example.com",
      displayName: "Dev",
      sprintFilter: String(sprintFilter),
      issues:
        sprintFilter === "all"
          ? [
              {
                key: "JOR-1",
                summary: "Task",
                statusName: "Open",
                statusCategoryKey: "new",
                issueTypeName: "Tarefa",
                priorityName: null,
                updated: "2026-05-29T10:00:00.000Z",
                browseUrl: "https://jusfy.atlassian.net/browse/JOR-1"
              }
            ]
          : [],
      cachedAt: null
    }));

    vi.spyOn(jiraIssueDetailService, "fetchJiraIssueDetail").mockImplementation(async (issueKey) => ({
      key: issueKey,
      summary: "Task",
      description: null,
      figmaUrls: [],
      hours: null,
      timeProgress: null,
      latestComment: null,
      browseUrl: `https://jusfy.atlassian.net/browse/${issueKey}`,
      cachedAt: null
    }));

    const saveSprints = vi.spyOn(jiraCacheRepository, "saveJiraSprintsCache").mockResolvedValue();
    const saveIssues = vi.spyOn(jiraCacheRepository, "saveJiraIssuesCache").mockResolvedValue();
    const saveDetail = vi.spyOn(jiraCacheRepository, "saveJiraIssueDetail").mockResolvedValue();
    const saveMeta = vi.spyOn(jiraCacheRepository, "saveJiraSyncMeta").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "pruneJiraIssuesCache").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "pruneJiraIssueDetails").mockResolvedValue();

    const result = await syncJiraCache({
      issueKeySource: {
        collectIssueKeys: async () => ["JOR-2"]
      }
    });

    expect(result.status).toBe("ok");
    expect(saveSprints).toHaveBeenCalled();
    expect(saveIssues).toHaveBeenCalled();
    expect(saveDetail).toHaveBeenCalledWith(
      "JOR-1",
      expect.objectContaining({ key: "JOR-1" })
    );
    expect(jiraIssueDetailService.fetchJiraIssueDetail).toHaveBeenCalledWith("JOR-2");
    expect(saveMeta).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ok", email: "dev@example.com" })
    );
    expect(writeSystemLogFireAndForget).not.toHaveBeenCalled();
  });

  it("emite resumo agregado quando detalhes de issues falham", async () => {
    vi.stubEnv("JIRA_EMAIL", "dev@example.com");
    vi.stubEnv("JIRA_TOKEN", "secret");

    vi.spyOn(jiraSprintService, "fetchJiraSprints").mockResolvedValue({
      boardId: 1,
      boardName: "Board",
      projectKey: "JOR",
      sprints: [],
      cachedAt: null
    });

    vi.spyOn(jiraService, "fetchAssignedJiraIssues").mockResolvedValue({
      email: "dev@example.com",
      displayName: "Dev",
      sprintFilter: "all",
      issues: [
        {
          key: "JOR-9",
          summary: "Task",
          statusName: "Open",
          statusCategoryKey: "new",
          issueTypeName: "Tarefa",
          priorityName: null,
          updated: "2026-05-29T10:00:00.000Z",
          browseUrl: "https://jusfy.atlassian.net/browse/JOR-9"
        }
      ],
      cachedAt: null
    });

    vi.spyOn(jiraIssueDetailService, "fetchJiraIssueDetail").mockRejectedValue(
      new Error("rate limit")
    );

    vi.spyOn(jiraCacheRepository, "saveJiraSprintsCache").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "saveJiraIssuesCache").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "saveJiraSyncMeta").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "pruneJiraIssuesCache").mockResolvedValue();
    vi.spyOn(jiraCacheRepository, "pruneJiraIssueDetails").mockResolvedValue();

    const result = await syncJiraCache();

    expect(result.status).toBe("ok");
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        source: "jira:sync",
        message: "Falha ao sincronizar detalhes de 1 issues.",
        details: { failed: ["JOR-9"], total: 1 }
      })
    );
  });
});
