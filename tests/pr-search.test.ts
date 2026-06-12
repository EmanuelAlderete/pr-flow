import { describe, expect, it } from "vitest";
import { filterPrsBySearch, matchesPrSearch } from "@/modules/prs/lib/pr-search";
import type { MonitoredPr } from "@/modules/prs/lib/domain";

const basePr: MonitoredPr = {
  id: "PR_1",
  number: 42,
  title: "feat: checkout rapido",
  url: "https://github.com/acme/a/pull/42",
  repository: "acme/checkout",
  createdAt: "2026-05-28T10:00:00Z",
  avaliou: [],
  naoAvaliou: ["maria"],
  semReviewersSolicitados: false,
  aprovou: [],
  solicitouAlteracoes: [],
  pendente: ["maria"],
  requestedReviewersCount: 1,
  statusGeral: "pending_review"
};

describe("pr-search", () => {
  it("retorna todas as PRs quando o termo esta vazio", () => {
    expect(filterPrsBySearch([basePr], "")).toEqual([basePr]);
    expect(filterPrsBySearch([basePr], "   ")).toEqual([basePr]);
  });

  it("filtra por titulo, numero, repositorio e reviewers", () => {
    expect(matchesPrSearch(basePr, "checkout")).toBe(true);
    expect(matchesPrSearch(basePr, "42")).toBe(true);
    expect(matchesPrSearch(basePr, "acme")).toBe(true);
    expect(matchesPrSearch(basePr, "maria")).toBe(true);
    expect(matchesPrSearch(basePr, "pagamento")).toBe(false);
  });
});
