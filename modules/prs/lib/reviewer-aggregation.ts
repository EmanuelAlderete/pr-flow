import type { MonitoredPr, MonitoredPrRaw, PrReview } from "@/modules/prs/lib/domain";
import {
  buildExcludedReviewLogins,
  filterExcludedLogins,
  isExcludedFromReviewCalculation
} from "@/modules/prs/lib/core/excluded-reviewers";
import { getPrStatus } from "@/modules/prs/lib/core/pr-status";
import { isReadyToMerge } from "@/modules/prs/lib/core/ready-to-merge";
import { buildSolicitedReviewerSet } from "@/modules/prs/lib/core/solicited-reviewers";

const VALID_REVIEW_STATES = new Set(["COMMENTED", "APPROVED", "CHANGES_REQUESTED"]);

function getLatestReviewPerLogin(reviews: PrReview[]): Map<string, PrReview> {
  const sortedReviews = [...reviews].sort((a, b) => {
    const left = Date.parse(a.submittedAt);
    const right = Date.parse(b.submittedAt);
    return left - right;
  });

  const latestByLogin = new Map<string, PrReview>();
  for (const review of sortedReviews) {
    latestByLogin.set(review.login, review);
  }

  return latestByLogin;
}

function withoutExcludedReviews(reviews: PrReview[], excluded: Set<string>): PrReview[] {
  return reviews.filter((review) => !isExcludedFromReviewCalculation(review.login, excluded));
}

export function aggregateReviewerStatus(pr: MonitoredPrRaw): MonitoredPr {
  const excluded = buildExcludedReviewLogins(pr.authorLogin);
  const latestByLogin = getLatestReviewPerLogin(withoutExcludedReviews(pr.reviews, excluded));
  const pendingRequests = filterExcludedLogins(pr.requestedReviewers, excluded);
  const solicitedSet = buildSolicitedReviewerSet(pendingRequests, latestByLogin, excluded);
  const avaliou = Array.from(latestByLogin.entries())
    .filter(([, review]) => VALID_REVIEW_STATES.has(review.state))
    .map(([login]) => login);
  const naoAvaliou: string[] = [];
  const aprovou: string[] = [];
  const solicitouAlteracoes: string[] = [];
  const pendente: string[] = [];

  for (const login of solicitedSet) {
    const review = latestByLogin.get(login);
    if (review && VALID_REVIEW_STATES.has(review.state)) {
      if (review.state === "APPROVED") {
        aprovou.push(login);
      } else if (review.state === "CHANGES_REQUESTED") {
        solicitouAlteracoes.push(login);
      }
      continue;
    }
    naoAvaliou.push(login);
    pendente.push(login);
  }

  const semReviewersSolicitados = pendingRequests.length === 0;
  const hasConflicts = Boolean(pr.hasConflicts);
  const hasUnresolvedComments = Boolean(pr.hasUnresolvedComments);
  const readyToMerge = isReadyToMerge({
    requestedReviewersCount: solicitedSet.size,
    pendingReviewersCount: pendente.length,
    requestedChangesCount: solicitouAlteracoes.length,
    hasConflicts,
    hasUnresolvedComments
  });
  const statusGeral = getPrStatus({
    readyToMerge,
    semReviewersSolicitados,
    requestedChangesCount: solicitouAlteracoes.length,
    pendingReviewersCount: pendente.length,
    requestedReviewersCount: solicitedSet.size
  });

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repository: pr.repository,
    createdAt: pr.createdAt,
    avaliou,
    naoAvaliou,
    semReviewersSolicitados,
    aprovou,
    solicitouAlteracoes,
    pendente,
    requestedReviewersCount: solicitedSet.size,
    statusGeral,
    readyToMerge,
    hasConflicts,
    hasUnresolvedComments
  };
}
