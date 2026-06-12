import type { PrReview } from "@/modules/prs/lib/domain";
import { isExcludedFromReviewCalculation } from "@/modules/prs/lib/core/excluded-reviewers";

const VALID_REVIEW_STATES = new Set(["COMMENTED", "APPROVED", "CHANGES_REQUESTED"]);

/**
 * O GraphQL retorna em reviewRequests apenas quem ainda nao revisou.
 * Para maioria/ready-to-merge, o time solicitado = pendentes atuais + quem ja enviou review.
 */
export function buildSolicitedReviewerSet(
  pendingRequests: string[],
  latestByLogin: Map<string, PrReview>,
  excluded: Set<string> = new Set()
): Set<string> {
  const solicited = new Set<string>();

  for (const login of pendingRequests) {
    if (!isExcludedFromReviewCalculation(login, excluded)) {
      solicited.add(login);
    }
  }

  for (const [login, review] of latestByLogin) {
    if (VALID_REVIEW_STATES.has(review.state) && !isExcludedFromReviewCalculation(login, excluded)) {
      solicited.add(login);
    }
  }

  return solicited;
}
