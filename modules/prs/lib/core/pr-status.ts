import type { MonitoredPr } from "@/modules/prs/lib/domain";
import { hasMajorityReviewed } from "@/modules/prs/lib/core/ready-to-merge";

export interface PrStatusInput {
  readyToMerge: boolean;
  semReviewersSolicitados: boolean;
  requestedChangesCount: number;
  pendingReviewersCount: number;
  requestedReviewersCount: number;
}

export function getPrStatus(input: PrStatusInput): MonitoredPr["statusGeral"] {
  const { readyToMerge, semReviewersSolicitados, requestedChangesCount, pendingReviewersCount, requestedReviewersCount } =
    input;

  if (readyToMerge) {
    return "approved";
  }
  if (semReviewersSolicitados) {
    return "no_reviewers";
  }
  if (requestedChangesCount > 0) {
    return "changes_requested";
  }
  if (pendingReviewersCount > 0 && !hasMajorityReviewed(requestedReviewersCount, pendingReviewersCount)) {
    return "pending_review";
  }
  return "approved";
}
