export const LOCAL_REVIEW_STALE_RUNNING_MS = 20 * 60 * 1000;
export const LOCAL_REVIEW_ERROR_RETRY_MS = 6 * 60 * 60 * 1000;

export type OpenPrRef = {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  createdAt: string;
};

export type PullRequestHead = {
  repository: string;
  number: number;
  headSha: string;
  baseRef: string;
};

export type StoredLocalReview = {
  repository: string;
  prNumber: number;
  headSha: string;
  status: string;
  updatedAt: Date;
};

export type LocalReviewCandidate = OpenPrRef & {
  headSha: string;
  baseRef: string;
};

export type LocalReviewPick =
  | { status: "busy" }
  | { status: "empty" }
  | { status: "ready"; candidate: LocalReviewCandidate };

export function pickNextLocalReview(input: {
  openPrs: OpenPrRef[];
  heads: PullRequestHead[];
  reviews: StoredLocalReview[];
  now: Date;
  staleRunningAfterMs?: number;
  retryErrorAfterMs?: number;
}): LocalReviewPick {
  const staleAfter = input.staleRunningAfterMs ?? LOCAL_REVIEW_STALE_RUNNING_MS;
  const retryAfter = input.retryErrorAfterMs ?? LOCAL_REVIEW_ERROR_RETRY_MS;
  const now = input.now.getTime();

  const busy = input.reviews.some(
    (review) => review.status === "running" && now - review.updatedAt.getTime() < staleAfter
  );
  if (busy) {
    return { status: "busy" };
  }

  const headsByKey = new Map(input.heads.map((head) => [`${head.repository}#${head.number}`, head]));
  const reviewsBySha = new Map(
    input.reviews.map((review) => [`${review.repository}#${review.prNumber}#${review.headSha}`, review])
  );

  const eligible = input.openPrs
    .map((pr) => {
      const head = headsByKey.get(`${pr.repository}#${pr.number}`);
      if (!head) {
        return null;
      }
      const review = reviewsBySha.get(`${pr.repository}#${pr.number}#${head.headSha}`);
      if (!isEligible(review, now, staleAfter, retryAfter)) {
        return null;
      }
      return { ...pr, headSha: head.headSha, baseRef: head.baseRef };
    })
    .filter((pr): pr is LocalReviewCandidate => pr !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const candidate = eligible[0];
  if (!candidate) {
    return { status: "empty" };
  }

  return { status: "ready", candidate };
}

function isEligible(
  review: StoredLocalReview | undefined,
  now: number,
  staleAfter: number,
  retryAfter: number
): boolean {
  if (!review) {
    return true;
  }
  if (review.status === "ok") {
    return false;
  }
  if (review.status === "running") {
    return now - review.updatedAt.getTime() >= staleAfter;
  }
  if (review.status === "error") {
    return now - review.updatedAt.getTime() >= retryAfter;
  }
  return true;
}
