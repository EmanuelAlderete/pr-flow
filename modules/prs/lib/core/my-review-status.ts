import type { MonitoredPrRaw, PrReview } from "@/modules/prs/lib/domain";

export type MyReviewStatus = "reviewed" | "pending" | "dismissed";

const VALID_REVIEW_STATES = new Set(["COMMENTED", "APPROVED", "CHANGES_REQUESTED"]);

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

function getLatestReviewForLogin(reviews: PrReview[], login: string): PrReview | undefined {
  const normalized = normalizeLogin(login);
  const mine = reviews.filter((review) => normalizeLogin(review.login) === normalized);
  if (mine.length === 0) {
    return undefined;
  }

  return [...mine].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)).at(-1);
}

export function isReviewerPullRequest(pr: MonitoredPrRaw, login: string): boolean {
  if (pr.authorLogin && normalizeLogin(pr.authorLogin) === normalizeLogin(login)) {
    return false;
  }

  const normalized = normalizeLogin(login);
  const requested = pr.requestedReviewers.some((reviewer) => normalizeLogin(reviewer) === normalized);
  const latest = getLatestReviewForLogin(pr.reviews, login);

  return requested || latest !== undefined;
}

export function getMyReviewStatus(pr: MonitoredPrRaw, login: string): MyReviewStatus {
  const latest = getLatestReviewForLogin(pr.reviews, login);

  if (latest?.state === "DISMISSED") {
    return "dismissed";
  }

  if (latest && VALID_REVIEW_STATES.has(latest.state)) {
    return "reviewed";
  }

  return "pending";
}

export function myReviewStatusLabel(status: MyReviewStatus): string {
  if (status === "reviewed") {
    return "Já avaliei";
  }
  if (status === "dismissed") {
    return "Perdeu minha avaliação";
  }
  return "Falta avaliar";
}

export function myReviewStatusSortRank(status: MyReviewStatus): number {
  if (status === "pending") {
    return 0;
  }
  if (status === "dismissed") {
    return 1;
  }
  return 2;
}
