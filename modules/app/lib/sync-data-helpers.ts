import type { PrApiResponse, ReviewerQueueApiResponse } from "@/modules/prs/lib/domain";

export function isPrMonitorWithData(
  response: PrApiResponse | null | undefined
): response is Extract<PrApiResponse, { status: "ok" } | { status: "stale" }> {
  return response?.status === "ok" || response?.status === "stale";
}

export function isReviewerQueueWithData(
  response: ReviewerQueueApiResponse | null | undefined
): response is Extract<ReviewerQueueApiResponse, { status: "ok" } | { status: "stale" }> {
  return response?.status === "ok" || response?.status === "stale";
}
