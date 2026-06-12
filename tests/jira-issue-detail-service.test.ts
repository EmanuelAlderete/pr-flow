import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/jira/lib/jira-client", () => ({
  jiraFetch: vi.fn()
}));

import { jiraFetch } from "@/modules/jira/lib/jira-client";
import { fetchJiraIssueDetail } from "@/modules/jira/lib/jira-issue-detail-service";

const jiraFetchMock = vi.mocked(jiraFetch);

describe("fetchJiraIssueDetail", () => {
  beforeEach(() => {
    jiraFetchMock.mockReset();
  });

  it("mapeia descrição, figma, horas e último comentário", async () => {
    jiraFetchMock.mockResolvedValue({
      key: "JOR-182",
      fields: {
        summary: "Incluir opção member get member no Menu",
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Figma: " },
                {
                  type: "text",
                  text: "https://www.figma.com/design/abc",
                  marks: [{ type: "link", attrs: { href: "https://www.figma.com/design/abc" } }]
                }
              ]
            }
          ]
        },
        timetracking: {
          originalEstimate: "4h",
          remainingEstimate: "2h",
          timeSpent: "2h",
          originalEstimateSeconds: 14400,
          remainingEstimateSeconds: 7200,
          timeSpentSeconds: 7200
        },
        timeoriginalestimate: 14400,
        customfield_10058: null,
        comment: {
          comments: [
            {
              created: "2026-05-29T09:14:15.253-0300",
              author: { displayName: "Emanuel Alderete" },
              body: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Primeiro comentário" }] }]
              }
            },
            {
              created: "2026-05-29T10:55:51.972-0300",
              author: { displayName: "Brunello" },
              body: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Último comentário" }] }]
              }
            }
          ]
        }
      }
    });

    const detail = await fetchJiraIssueDetail("jor-182");

    expect(jiraFetchMock).toHaveBeenCalledWith(expect.stringContaining("/issue/JOR-182?fields="));
    expect(detail.key).toBe("JOR-182");
    expect(detail.summary).toContain("member get member");
    expect(detail.description).toContain("Figma:");
    expect(detail.figmaUrls).toEqual(["https://www.figma.com/design/abc"]);
    expect(detail.hours).toBe("Estimativa: 4h · Gasto: 2h · Restante: 2h");
    expect(detail.timeProgress).toEqual({
      estimateSeconds: 14400,
      spentSeconds: 7200,
      remainingSeconds: 7200,
      estimateLabel: "4h",
      spentLabel: "2h",
      remainingLabel: "2h",
      percent: 50
    });
    expect(detail.latestComment?.body).toBe("Último comentário");
    expect(detail.latestComment?.authorName).toBe("Brunello");
    expect(detail.browseUrl).toBe("https://jusfy.atlassian.net/browse/JOR-182");
  });
});
