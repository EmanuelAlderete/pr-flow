import { describe, expect, it } from "vitest";
import { buildSolicitedReviewerSet } from "@/modules/prs/lib/core/solicited-reviewers";
import type { PrReview } from "@/modules/prs/lib/domain";

describe("buildSolicitedReviewerSet", () => {
  it("une pendentes da api com logins que ja revisaram", () => {
    const latest = new Map<string, PrReview>([
      ["ana", { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }],
      ["bruno", { login: "bruno", state: "APPROVED", submittedAt: "2026-05-28T10:01:00Z" }]
    ]);

    const set = buildSolicitedReviewerSet(["carla", "diana"], latest);
    expect(Array.from(set).sort()).toEqual(["ana", "bruno", "carla", "diana"]);
  });
});
