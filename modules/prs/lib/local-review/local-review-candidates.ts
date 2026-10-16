export const LOCAL_REVIEW_STALE_RUNNING_MS = 20 * 60 * 1000;
export const LOCAL_REVIEW_ERROR_RETRY_MS = 6 * 60 * 60 * 1000;

export type OpenPrRef = {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  createdAt: string;
  /** Menor valor roda primeiro. Pendente vem antes de já revisada. */
  priority?: number;
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

export type TargetedReviewDecision =
  | { status: "ready"; candidate: LocalReviewCandidate }
  | { status: "busy"; repository: string; prNumber: number }
  | { status: "already" }
  | { status: "missing" }
  | { status: "closed" };

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
    .sort((a, b) => {
      const priority = (a.priority ?? 0) - (b.priority ?? 0);
      if (priority !== 0) {
        return priority;
      }
      const created = a.createdAt.localeCompare(b.createdAt);
      if (created !== 0) {
        return created;
      }
      return a.number - b.number;
    });

  const candidate = eligible[0];
  if (!candidate) {
    return { status: "empty" };
  }

  return { status: "ready", candidate };
}

export function resolveTargetedReview(input: {
  repository: string;
  number: number;
  openPrs: OpenPrRef[];
  heads: PullRequestHead[];
  reviews: StoredLocalReview[];
  now: Date;
  staleRunningAfterMs?: number;
}): TargetedReviewDecision {
  const pr = input.openPrs.find(
    (item) => item.repository === input.repository && item.number === input.number
  );
  if (!pr) {
    return { status: "missing" };
  }

  const head = input.heads.find(
    (item) => item.repository === input.repository && item.number === input.number
  );
  if (!head) {
    return { status: "closed" };
  }

  const staleAfter = input.staleRunningAfterMs ?? LOCAL_REVIEW_STALE_RUNNING_MS;
  const now = input.now.getTime();
  const freshRunning = input.reviews.find(
    (review) => review.status === "running" && now - review.updatedAt.getTime() < staleAfter
  );
  if (
    freshRunning &&
    freshRunning.repository === input.repository &&
    freshRunning.prNumber === input.number &&
    freshRunning.headSha === head.headSha
  ) {
    return { status: "already" };
  }
  if (freshRunning) {
    return { status: "busy", repository: freshRunning.repository, prNumber: freshRunning.prNumber };
  }

  return {
    status: "ready",
    candidate: { ...pr, headSha: head.headSha, baseRef: head.baseRef }
  };
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
