/** Logins ignorados no calculo de revisao/ready-to-merge (comparacao case-insensitive). */
export const REVIEW_CALCULATION_EXCLUDED_LOGINS = ["coderabbitai"] as const;

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function buildExcludedReviewLogins(authorLogin?: string): Set<string> {
  const excluded = new Set(REVIEW_CALCULATION_EXCLUDED_LOGINS.map((login) => normalizeLogin(login)));
  if (authorLogin?.trim()) {
    excluded.add(normalizeLogin(authorLogin));
  }
  return excluded;
}

export function isExcludedFromReviewCalculation(login: string, excluded: Set<string>): boolean {
  return excluded.has(normalizeLogin(login));
}

export function filterExcludedLogins(logins: string[], excluded: Set<string>): string[] {
  return logins.filter((login) => !isExcludedFromReviewCalculation(login, excluded));
}
