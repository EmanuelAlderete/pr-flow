import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAssignedJiraIssues } from "@/modules/jira/lib/jira-service";

describe("fetchAssignedJiraIssues", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("maps search results to issue DTOs", async () => {
    vi.stubEnv("JIRA_EMAIL", "dev@example.com");
    vi.stubEnv("JIRA_TOKEN", "secret-token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ displayName: "Dev User", emailAddress: "dev@example.com" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [
            {
              key: "JOR-1",
              fields: {
                summary: "Primeira tarefa",
                status: { name: "Em progresso", statusCategory: { key: "indeterminate" } },
                priority: { name: "High" },
                issuetype: { name: "Tarefa" },
                updated: "2026-05-29T10:00:00.000-0300"
              }
            }
          ],
          isLast: true
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAssignedJiraIssues({ sprintFilter: "4943" });

    expect(result.email).toBe("dev@example.com");
    expect(result.displayName).toBe("Dev User");
    expect(result.sprintFilter).toBe("4943");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      key: "JOR-1",
      summary: "Primeira tarefa",
      statusName: "Em progresso",
      statusCategoryKey: "indeterminate",
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-1"
    });

    const searchCall = fetchMock.mock.calls[1];
    expect(searchCall?.[0]).toContain("/rest/api/3/search/jql");
    expect(searchCall?.[1]?.method).toBe("POST");
    const body = JSON.parse(String(searchCall?.[1]?.body));
    expect(body.jql).toContain("assignee = currentUser()");
    expect(body.jql).toContain("sprint = 4943");
  });
});
