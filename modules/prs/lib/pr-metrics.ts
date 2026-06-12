import type { MonitoredPr, PrReview, PrReviewContextRecord } from "@/modules/prs/lib/domain";

export type PrInsights = {
  openPrCount: number;
  coolingPrCount: number;
  averageOpenDays: number | null;
  pendingReviewCount: number;
  averageTimeToFirstReviewHours: number | null;
};

export type BuildPrInsightsInput = {
  openPrs: MonitoredPr[];
  pendingReviewCount: number;
  reviewContext?: PrReviewContextRecord[];
  now?: Date;
  coolingDaysThreshold?: number;
};

const DEFAULT_COOLING_DAYS = 3;

function daysBetween(startIso: string, end: Date): number {
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) {
    return 0;
  }

  return Math.max(0, (end.getTime() - start) / (1000 * 60 * 60 * 24));
}

function isCoolingPr(pr: MonitoredPr, now: Date, thresholdDays: number): boolean {
  return pr.avaliou.length === 0 && daysBetween(pr.createdAt, now) >= thresholdDays;
}

function getFirstReviewSubmittedAt(reviews: PrReview[]): string | null {
  const valid = reviews
    .map((review) => ({ review, at: Date.parse(review.submittedAt) }))
    .filter((entry) => !Number.isNaN(entry.at))
    .sort((left, right) => left.at - right.at);

  return valid[0]?.review.submittedAt ?? null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildPrInsights(input: BuildPrInsightsInput): PrInsights {
  const now = input.now ?? new Date();
  const coolingDaysThreshold = input.coolingDaysThreshold ?? DEFAULT_COOLING_DAYS;
  const openPrs = input.openPrs;

  const openDays = openPrs.map((pr) => daysBetween(pr.createdAt, now));
  const averageOpenDays = average(openDays);

  const reviewContextById = new Map((input.reviewContext ?? []).map((record) => [record.id, record]));
  const firstReviewHours = openPrs
    .map((pr) => {
      const context = reviewContextById.get(pr.id);
      if (!context || context.reviews.length === 0) {
        return null;
      }

      const firstReviewAt = getFirstReviewSubmittedAt(context.reviews);
      if (!firstReviewAt) {
        return null;
      }

      const hours = (Date.parse(firstReviewAt) - Date.parse(pr.createdAt)) / (1000 * 60 * 60);
      return hours >= 0 ? hours : null;
    })
    .filter((value): value is number => value !== null);

  return {
    openPrCount: openPrs.length,
    coolingPrCount: openPrs.filter((pr) => isCoolingPr(pr, now, coolingDaysThreshold)).length,
    averageOpenDays: averageOpenDays === null ? null : roundOneDecimal(averageOpenDays),
    pendingReviewCount: input.pendingReviewCount,
    averageTimeToFirstReviewHours:
      average(firstReviewHours) === null ? null : roundOneDecimal(average(firstReviewHours)!)
  };
}

function pluralize(value: number, singular: string, plural: string): string {
  const rounded = Math.round(value);
  const label = Number.isInteger(value) ? String(rounded) : value.toFixed(1).replace(".", ",");
  const unit = rounded === 1 ? singular : plural;
  return `${label} ${unit}`;
}

export function formatAverageOpenDays(days: number | null): string {
  if (days === null) {
    return "—";
  }

  return pluralize(days, "dia", "dias");
}

export function formatAverageTimeToFirstReview(hours: number | null): string {
  if (hours === null) {
    return "—";
  }

  if (hours < 24) {
    return pluralize(Math.round(hours), "hora", "horas");
  }

  const days = roundOneDecimal(hours / 24);
  const label = days.toFixed(1).replace(".", ",");
  return days === 1 ? "1 dia" : `${label} dias`;
}
