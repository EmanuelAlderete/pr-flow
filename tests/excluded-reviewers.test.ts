import { describe, expect, it } from "vitest";
import { aggregateReviewerStatus } from "@/modules/prs/lib/reviewer-aggregation";
import {
  buildExcludedReviewLogins,
  isExcludedFromReviewCalculation,
  REVIEW_CALCULATION_EXCLUDED_LOGINS
} from "@/modules/prs/lib/core/excluded-reviewers";
import type { MonitoredPrRaw } from "@/modules/prs/lib/domain";

const basePr: MonitoredPrRaw = {
  id: "pr_1",
  number: 42,
  title: "JOR-1 feat",
  url: "https://github.com/acme/demo/pull/42",
  repository: "acme/demo",
  createdAt: "2026-05-28T10:00:00Z",
  authorLogin: "rigon",
  requestedReviewers: ["ana", "bruno", "coderabbitai"],
  reviews: [
    { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
    { login: "coderabbitai", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" },
    { login: "rigon", state: "COMMENTED", submittedAt: "2026-05-28T10:02:00Z" }
  ]
};

describe("excluded reviewers", () => {
  it("inclui autor e coderabbitai na lista de exclusao", () => {
    const excluded = buildExcludedReviewLogins("rigon");
    expect(isExcludedFromReviewCalculation("rigon", excluded)).toBe(true);
    expect(isExcludedFromReviewCalculation("Rigon", excluded)).toBe(true);
    expect(isExcludedFromReviewCalculation("coderabbitai", excluded)).toBe(true);
    expect(REVIEW_CALCULATION_EXCLUDED_LOGINS).toContain("coderabbitai");
  });

  it("desconsidera autor e coderabbitai no calculo de revisao", () => {
    const result = aggregateReviewerStatus(basePr);

    expect(result.avaliou).toEqual(["ana"]);
    expect(result.pendente).toEqual(["bruno"]);
    expect(result.requestedReviewersCount).toBe(2);
    expect(result.naoAvaliou).not.toContain("coderabbitai");
    expect(result.avaliou).not.toContain("rigon");
    expect(result.avaliou).not.toContain("coderabbitai");
  });
});
