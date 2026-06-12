import type { MonitoredPr } from "@/modules/prs/lib/domain";
import { hasMajorityReviewed } from "@/modules/prs/lib/core/ready-to-merge";

export type ImpedimentTone = "danger" | "warning" | "success";

export type ImpedimentIconKind =
  | "conflicts"
  | "unresolved-comments"
  | "changes-requested"
  | "pending-reviews"
  | "pending-review"
  | "sufficient-approvals";

export function hasSufficientApprovalsWithConflict(input: {
  statusGeral: MonitoredPr["statusGeral"];
  hasConflicts?: boolean;
}): boolean {
  return input.statusGeral === "approved" && Boolean(input.hasConflicts);
}

export interface PrImpediment {
  key: string;
  label: string;
  icon: ImpedimentIconKind;
  tone: ImpedimentTone;
}

export interface PrImpedimentsInput {
  statusGeral: MonitoredPr["statusGeral"];
  hasConflicts?: boolean;
  hasUnresolvedComments?: boolean;
  pendingReviewersCount: number;
  requestedReviewersCount: number;
  requestedChangesCount: number;
}

export function getPrImpediments(input: PrImpedimentsInput): PrImpediment[] {
  const impediments: PrImpediment[] = [];

  if (hasSufficientApprovalsWithConflict(input)) {
    impediments.push({
      key: "sufficient-approvals",
      label: "Já possui aprovações suficientes",
      icon: "sufficient-approvals",
      tone: "danger"
    });
  }

  if (input.hasConflicts) {
    impediments.push({
      key: "conflicts",
      label: "Conflitos detectados",
      icon: "conflicts",
      tone: "danger"
    });
  }

  if (input.hasUnresolvedComments) {
    impediments.push({
      key: "unresolved-comments",
      label: "Comentários não resolvidos",
      icon: "unresolved-comments",
      tone: "danger"
    });
  }

  if (input.requestedChangesCount > 0) {
    impediments.push({
      key: "changes-requested",
      label: "Alterações solicitadas",
      icon: "changes-requested",
      tone: "danger"
    });
  }

  const awaitingMajority =
    input.pendingReviewersCount > 0 &&
    !hasMajorityReviewed(input.requestedReviewersCount, input.pendingReviewersCount);

  if (awaitingMajority) {
    const count = input.pendingReviewersCount;
    impediments.push({
      key: "pending-reviews",
      label: count === 1 ? "1 revisão pendente" : `${count} revisões pendentes`,
      icon: "pending-reviews",
      tone: "danger"
    });
  }

  if (input.statusGeral === "pending_review" && impediments.length === 0) {
    impediments.push({
      key: "pending-review",
      label: "Revisão pendente para seguir com merge",
      icon: "pending-review",
      tone: "danger"
    });
  }

  return impediments;
}

export function mustShowImpedimentIcons(statusGeral: MonitoredPr["statusGeral"]): boolean {
  return statusGeral === "pending_review";
}
