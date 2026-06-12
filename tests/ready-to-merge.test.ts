import { describe, expect, it } from "vitest";
import { hasMajorityReviewed, hasMergeBlockers, isReadyToMerge } from "@/modules/prs/lib/core/ready-to-merge";

describe("ready-to-merge policy", () => {
  it("considera maioria quando mais da metade dos solicitados revisou", () => {
    expect(hasMajorityReviewed(7, 2)).toBe(true);
    expect(hasMajorityReviewed(3, 1)).toBe(true);
    expect(hasMajorityReviewed(3, 2)).toBe(false);
  });

  it("detecta impedimentos de merge", () => {
    expect(hasMergeBlockers({ hasConflicts: true, hasUnresolvedComments: false, requestedChangesCount: 0 })).toBe(true);
    expect(hasMergeBlockers({ hasConflicts: false, hasUnresolvedComments: true, requestedChangesCount: 0 })).toBe(true);
    expect(hasMergeBlockers({ hasConflicts: false, hasUnresolvedComments: false, requestedChangesCount: 1 })).toBe(true);
    expect(hasMergeBlockers({ hasConflicts: false, hasUnresolvedComments: false, requestedChangesCount: 0 })).toBe(false);
  });

  it("marca pronta com maioria revisada e sem impedimentos", () => {
    expect(
      isReadyToMerge({
        requestedReviewersCount: 7,
        pendingReviewersCount: 2,
        requestedChangesCount: 0,
        hasConflicts: false,
        hasUnresolvedComments: false
      })
    ).toBe(true);
  });

  it("nao marca pronta com comentarios nao resolvidos", () => {
    expect(
      isReadyToMerge({
        requestedReviewersCount: 7,
        pendingReviewersCount: 2,
        requestedChangesCount: 0,
        hasConflicts: false,
        hasUnresolvedComments: true
      })
    ).toBe(false);
  });
});
