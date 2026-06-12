import { afterEach, describe, expect, it, vi } from "vitest";
import { JiraConfigError } from "@/modules/jira/lib/jira-config";
import { JiraCacheNotReadyError } from "@/modules/jira/lib/jira-cache-errors";
import * as jiraReadService from "@/modules/jira/lib/jira-read-service";
import { GET } from "@/app/api/jira/issues/route";

describe("GET /api/jira/issues", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid sprint filter", async () => {
    const response = await GET(new Request("http://localhost/api/jira/issues?sprint=foo"));
    expect(response.status).toBe(400);
  });

  it("returns 503 when Jira is not configured", async () => {
    vi.spyOn(jiraReadService, "getJiraIssuesFromCache").mockRejectedValue(
      new JiraConfigError("Configure JIRA_EMAIL e JIRA_TOKEN no .env para usar a integração com o Jira.")
    );

    const response = await GET(new Request("http://localhost/api/jira/issues"));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/JIRA_EMAIL/i);
  });

  it("returns 503 when cache is not ready", async () => {
    vi.spyOn(jiraReadService, "getJiraIssuesFromCache").mockRejectedValue(new JiraCacheNotReadyError());

    const response = await GET(new Request("http://localhost/api/jira/issues"));
    expect(response.status).toBe(503);
  });

  it("returns cached issues", async () => {
    vi.spyOn(jiraReadService, "getJiraIssuesFromCache").mockResolvedValue({
      email: "dev@example.com",
      displayName: "Dev",
      sprintFilter: "all",
      issues: [],
      cachedAt: "2026-05-29T12:00:00.000Z"
    });

    const response = await GET(new Request("http://localhost/api/jira/issues"));
    const body = (await response.json()) as { cachedAt: string };

    expect(response.status).toBe(200);
    expect(body.cachedAt).toBe("2026-05-29T12:00:00.000Z");
  });
});
