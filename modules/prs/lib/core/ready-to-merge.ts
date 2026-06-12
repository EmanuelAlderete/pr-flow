export interface ReadyToMergeInput {
  requestedReviewersCount: number;
  pendingReviewersCount: number;
  requestedChangesCount: number;
  hasConflicts: boolean;
  hasUnresolvedComments: boolean;
}

export function hasMajorityReviewed(requestedReviewersCount: number, pendingReviewersCount: number): boolean {
  if (requestedReviewersCount === 0) {
    return false;
  }
  const completedReviews = requestedReviewersCount - pendingReviewersCount;
  return completedReviews > requestedReviewersCount / 2;
}

export function hasMergeBlockers(input: Pick<ReadyToMergeInput, "hasConflicts" | "hasUnresolvedComments" | "requestedChangesCount">): boolean {
  return Boolean(input.hasConflicts || input.hasUnresolvedComments || input.requestedChangesCount > 0);
}

/** PR pronta: maioria dos solicitados ja revisou e nao ha impedimentos. */
export function isReadyToMerge(input: ReadyToMergeInput): boolean {
  if (input.requestedReviewersCount === 0) {
    return false;
  }
  if (hasMergeBlockers(input)) {
    return false;
  }
  return hasMajorityReviewed(input.requestedReviewersCount, input.pendingReviewersCount);
}
