import { describe, expect, it } from "vitest";
import type { MonitoredPrRaw } from "@/modules/prs/lib/domain";
import {
  getMyReviewStatus,
  isReviewerPullRequest,
  myReviewStatusLabel
} from "@/modules/prs/lib/core/my-review-status";

function buildPr(overrides: Partial<MonitoredPrRaw> = {}): MonitoredPrRaw {
  return {
    id: "PR_1",
    number: 1,
    title: "feat: exemplo",
    url: "https://github.com/acme/a/pull/1",
    repository: "acme/a",
    createdAt: "2026-05-20T08:00:00Z",
    authorLogin: "autor",
    requestedReviewers: [],
    reviews: [],
    ...overrides
  };
}

describe("my-review-status", () => {
  it("ignora PRs do proprio autor", () => {
    const pr = buildPr({ authorLogin: "rigon", requestedReviewers: ["rigon"] });
    expect(isReviewerPullRequest(pr, "rigon")).toBe(false);
  });

  it("marca pendente quando revisao foi solicitada e ainda nao avaliou", () => {
    const pr = buildPr({ requestedReviewers: ["rigon"] });
    expect(isReviewerPullRequest(pr, "rigon")).toBe(true);
    expect(getMyReviewStatus(pr, "rigon")).toBe("pending");
    expect(myReviewStatusLabel("pending")).toBe("Falta avaliar");
  });

  it("marca revisado quando ja existe review valida", () => {
    const pr = buildPr({
      reviews: [{ login: "rigon", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }]
    });
    expect(getMyReviewStatus(pr, "rigon")).toBe("reviewed");
    expect(myReviewStatusLabel("reviewed")).toBe("Já avaliei");
  });

  it("marca desatualizada quando a ultima review foi dismissed", () => {
    const pr = buildPr({
      requestedReviewers: ["rigon"],
      reviews: [
        { login: "rigon", state: "APPROVED", submittedAt: "2026-05-27T10:00:00Z" },
        { login: "rigon", state: "DISMISSED", submittedAt: "2026-05-28T12:00:00Z" }
      ]
    });
    expect(getMyReviewStatus(pr, "rigon")).toBe("dismissed");
    expect(myReviewStatusLabel("dismissed")).toBe("Perdeu minha avaliação");
  });
});
