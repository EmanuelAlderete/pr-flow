import { describe, expect, it } from "vitest";
import {
  findOpenPrsByJiraIssueKey,
  resolveSlackTicketChannelLabel
} from "@/modules/prs/lib/core/pr-slack-related";
import type { MonitoredPr } from "@/modules/prs/lib/domain";

function makePr(overrides: Partial<MonitoredPr> & Pick<MonitoredPr, "id" | "title" | "url" | "repository" | "number">): MonitoredPr {
  return {
    createdAt: "2026-05-28T10:00:00Z",
    avaliou: [],
    naoAvaliou: [],
    semReviewersSolicitados: false,
    aprovou: [],
    solicitouAlteracoes: [],
    pendente: [],
    requestedReviewersCount: 0,
    statusGeral: "pending_review",
    ...overrides
  };
}

describe("findOpenPrsByJiraIssueKey", () => {
  it("retorna PRs abertas com a mesma chave Jira", () => {
    const prs = [
      makePr({
        id: "1",
        number: 1,
        title: "JOR-99 API",
        url: "https://github.com/acme/api/pull/1",
        repository: "acme/api"
      }),
      makePr({
        id: "2",
        number: 2,
        title: "JOR-99 Web",
        url: "https://github.com/acme/web/pull/2",
        repository: "acme/web"
      }),
      makePr({
        id: "3",
        number: 3,
        title: "JOR-100 Outro",
        url: "https://github.com/acme/api/pull/3",
        repository: "acme/api"
      })
    ];

    expect(findOpenPrsByJiraIssueKey(prs, "JOR-99")).toEqual([
      expect.objectContaining({ id: "1", repository: "acme/api" }),
      expect.objectContaining({ id: "2", repository: "acme/web" })
    ]);
  });
});

describe("resolveSlackTicketChannelLabel", () => {
  it("extrai resumo do titulo da PR", () => {
    expect(resolveSlackTicketChannelLabel("JOR-99 Ajuste no fluxo", "JOR-99")).toBe("JOR-99 - Ajuste no fluxo");
  });

  it("mantem titulo quando nao ha resumo apos a chave", () => {
    expect(resolveSlackTicketChannelLabel("JOR-99", "JOR-99")).toBe("JOR-99");
  });
});
