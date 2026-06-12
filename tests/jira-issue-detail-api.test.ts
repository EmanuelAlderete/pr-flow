import { beforeEach, describe, expect, it, vi } from "vitest";
import { JiraConfigError } from "@/modules/jira/lib/jira-config";
import { JiraCacheNotReadyError } from "@/modules/jira/lib/jira-cache-errors";

vi.mock("@/modules/jira/lib/jira-read-service", () => ({
  getJiraIssueDetailFromCache: vi.fn()
}));

import { GET } from "@/app/api/jira/issues/[issueKey]/route";
import { getJiraIssueDetailFromCache } from "@/modules/jira/lib/jira-read-service";

const getJiraIssueDetailFromCacheMock = vi.mocked(getJiraIssueDetailFromCache);

describe("GET /api/jira/issues/[issueKey]", () => {
  beforeEach(() => {
    getJiraIssueDetailFromCacheMock.mockReset();
  });

  it("retorna 400 para chave inválida", async () => {
    const response = await GET(new Request("http://localhost/api/jira/issues/foo"), {
      params: Promise.resolve({ issueKey: "foo" })
    });

    expect(response.status).toBe(400);
  });

  it("retorna detalhes do ticket do cache", async () => {
    getJiraIssueDetailFromCacheMock.mockResolvedValue({
      key: "JOR-99",
      summary: "Task",
      description: "Desc",
      figmaUrls: [],
      hours: null,
      timeProgress: null,
      latestComment: null,
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-99",
      cachedAt: "2026-05-29T12:00:00.000Z"
    });

    const response = await GET(new Request("http://localhost/api/jira/issues/JOR-99"), {
      params: Promise.resolve({ issueKey: "JOR-99" })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.key).toBe("JOR-99");
    expect(getJiraIssueDetailFromCacheMock).toHaveBeenCalledWith("JOR-99");
  });

  it("retorna 404 quando o ticket não está no cache", async () => {
    getJiraIssueDetailFromCacheMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/jira/issues/JOR-99"), {
      params: Promise.resolve({ issueKey: "JOR-99" })
    });

    expect(response.status).toBe(404);
  });

  it("retorna 503 quando Jira não está configurado", async () => {
    getJiraIssueDetailFromCacheMock.mockRejectedValue(
      new JiraConfigError("Configure JIRA_EMAIL e JIRA_TOKEN no .env para usar a integração com o Jira.")
    );

    const response = await GET(new Request("http://localhost/api/jira/issues/JOR-99"), {
      params: Promise.resolve({ issueKey: "JOR-99" })
    });

    expect(response.status).toBe(503);
  });

  it("retorna 503 quando o cache ainda não foi sincronizado", async () => {
    getJiraIssueDetailFromCacheMock.mockRejectedValue(new JiraCacheNotReadyError());

    const response = await GET(new Request("http://localhost/api/jira/issues/JOR-99"), {
      params: Promise.resolve({ issueKey: "JOR-99" })
    });

    expect(response.status).toBe(503);
  });
});
