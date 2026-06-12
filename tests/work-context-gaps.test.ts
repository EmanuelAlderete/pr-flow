import { describe, expect, it } from "vitest";
import { detectWorkContextGaps } from "@/modules/work-context/lib/work-context-gaps";
import type { WorkContextGapInput } from "@/modules/work-context/lib/domain";

function input(overrides: Partial<WorkContextGapInput> = {}): WorkContextGapInput {
  return {
    jiraStatusCategoryKey: null,
    openPullRequests: [],
    tasks: [],
    journalMentions: [],
    ...overrides
  };
}

describe("detectWorkContextGaps", () => {
  it("alerta quando há PR aberta e ticket Jira está Done", () => {
    const gaps = detectWorkContextGaps(
      input({
        jiraStatusCategoryKey: "done",
        openPullRequests: [
          {
            number: 1,
            title: "JOR-1 feat",
            repository: "acme/repo",
            url: "https://x",
            statusGeral: "pending_review"
          }
        ]
      })
    );

    expect(gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "open_pr_ticket_done",
          severity: "warning",
          message: expect.stringContaining("pull request")
        })
      ])
    );
  });

  it("alerta suave quando ticket em progresso sem PR, task ou nota", () => {
    const gaps = detectWorkContextGaps(
      input({
        jiraStatusCategoryKey: "indeterminate"
      })
    );

    expect(gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "ticket_in_progress_no_activity",
          severity: "info"
        })
      ])
    );
  });

  it("alerta quando task concluída e ticket ainda aberto", () => {
    const gaps = detectWorkContextGaps(
      input({
        jiraStatusCategoryKey: "new",
        tasks: [{ id: "t1", title: "JOR-2 algo", completed: true }]
      })
    );

    expect(gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "task_done_ticket_open",
          severity: "warning"
        })
      ])
    );
  });

  it("não emite alertas quando contexto está alinhado", () => {
    const gaps = detectWorkContextGaps(
      input({
        jiraStatusCategoryKey: "indeterminate",
        openPullRequests: [
          {
            number: 2,
            title: "JOR-3 fix",
            repository: "acme/repo",
            url: "https://x",
            statusGeral: "pending_review"
          }
        ],
        journalMentions: [{ notebookDay: "2026-05-28", excerpt: "JOR-3 em review" }]
      })
    );

    expect(gaps).toHaveLength(0);
  });
});
