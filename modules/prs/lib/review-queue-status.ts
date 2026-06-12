import type { MyReviewStatus } from "@/modules/prs/lib/domain";

export type ReviewQueueFilter = "all" | MyReviewStatus;

export function reviewQueueCardClass(status: MyReviewStatus): string {
  if (status === "pending") {
    return "review-queue-card--pending";
  }
  if (status === "reviewed") {
    return "review-queue-card--reviewed";
  }
  return "review-queue-card--dismissed";
}

export function reviewQueueStatusPillClass(status: MyReviewStatus): string {
  if (status === "pending") {
    return "review-queue-card__status--pending";
  }
  if (status === "reviewed") {
    return "review-queue-card__status--reviewed";
  }
  return "review-queue-card__status--dismissed";
}

export function reviewQueueFilterLabel(filter: ReviewQueueFilter): string {
  if (filter === "all") {
    return "Todas";
  }
  if (filter === "pending") {
    return "Falta avaliar";
  }
  if (filter === "reviewed") {
    return "Já avaliei";
  }
  return "Perdeu avaliação";
}
