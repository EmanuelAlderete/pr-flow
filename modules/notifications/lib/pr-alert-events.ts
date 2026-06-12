import type { MonitoredPr, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import {
  type NotificationAlertType,
  type NotificationPreferences,
  isAlertTypeEnabled
} from "@/modules/notifications/lib/notification-preferences";

export type PrAlertEvent = {
  id: string;
  type: NotificationAlertType;
  title: string;
  body: string;
};

function statusLabel(status: MonitoredPr["statusGeral"]): string {
  if (status === "approved") {
    return "Aprovada";
  }
  if (status === "changes_requested") {
    return "Alterações solicitadas";
  }
  if (status === "pending_review") {
    return "Revisão pendente";
  }
  return "Sem reviewers";
}

function alertTypeForStatusChange(
  previous: MonitoredPr["statusGeral"],
  next: MonitoredPr["statusGeral"]
): NotificationAlertType | null {
  if (previous === next) {
    return null;
  }

  if (next === "approved") {
    return "prApproved";
  }
  if (next === "changes_requested") {
    return "prChangesRequested";
  }

  return "prStatusChanged";
}

function daysBetween(startIso: string, end: Date): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function maybePushAlert(
  alerts: PrAlertEvent[],
  type: NotificationAlertType,
  preferences: NotificationPreferences,
  id: string,
  title: string,
  body: string
) {
  if (!isAlertTypeEnabled(preferences, type)) {
    return;
  }

  alerts.push({ id, type, title, body });
}

export function detectPrMonitorAlerts(
  previous: MonitoredPr[] | null,
  next: MonitoredPr[],
  preferences: NotificationPreferences,
  now: Date = new Date()
): PrAlertEvent[] {
  const alerts: PrAlertEvent[] = [];

  if (previous === null) {
    return alerts;
  }

  const previousById = new Map(previous.map((pr) => [pr.id, pr]));
  const nextById = new Map(next.map((pr) => [pr.id, pr]));

  for (const [id, currentPr] of nextById) {
    const oldPr = previousById.get(id);
    if (!oldPr) {
      maybePushAlert(
        alerts,
        "prStatusChanged",
        preferences,
        `${id}:opened`,
        `Nova PR #${currentPr.number}`,
        currentPr.title
      );
      continue;
    }

    const changeType = alertTypeForStatusChange(oldPr.statusGeral, currentPr.statusGeral);
    if (changeType) {
      maybePushAlert(
        alerts,
        changeType,
        preferences,
        `${id}:${currentPr.statusGeral}`,
        `PR #${currentPr.number}: ${statusLabel(currentPr.statusGeral)}`,
        `${statusLabel(oldPr.statusGeral)} → ${statusLabel(currentPr.statusGeral)} · ${currentPr.title}`
      );
    }

    if (
      isAlertTypeEnabled(preferences, "prStale") &&
      daysBetween(currentPr.createdAt, now) >= preferences.staleDaysThreshold
    ) {
      const staleDays = Math.floor(daysBetween(currentPr.createdAt, now));
      maybePushAlert(
        alerts,
        "prStale",
        preferences,
        `${id}:stale`,
        `PR #${currentPr.number} parada há ${staleDays} dias`,
        currentPr.title
      );
    }
  }

  for (const [id, oldPr] of previousById) {
    if (!nextById.has(id)) {
      maybePushAlert(
        alerts,
        "prStatusChanged",
        preferences,
        `${id}:removed`,
        `PR #${oldPr.number} saiu do monitor`,
        oldPr.title
      );
    }
  }

  return alerts;
}

export function detectReviewerQueueAlerts(
  previous: ReviewerQueuePr[] | null,
  next: ReviewerQueuePr[],
  preferences: NotificationPreferences
): PrAlertEvent[] {
  if (previous === null || !isAlertTypeEnabled(preferences, "reviewerQueueNew")) {
    return [];
  }

  const previousIds = new Set(previous.map((pr) => pr.id));
  const alerts: PrAlertEvent[] = [];

  for (const pr of next) {
    if (previousIds.has(pr.id) || pr.myReviewStatus !== "pending") {
      continue;
    }

    alerts.push({
      id: `${pr.id}:queue-new`,
      type: "reviewerQueueNew",
      title: `Nova PR para revisar #${pr.number}`,
      body: pr.title
    });
  }

  return alerts;
}

/** Resumo textual para modal na página de monitor (ignora preferências). */
export function summarizePrMonitorChanges(previous: MonitoredPr[] | null, next: MonitoredPr[]): string[] {
  if (previous === null) {
    return [];
  }

  const previousById = new Map(previous.map((pr) => [pr.id, pr]));
  const nextById = new Map(next.map((pr) => [pr.id, pr]));
  const changes: string[] = [];

  for (const [id, currentPr] of nextById) {
    const oldPr = previousById.get(id);
    if (!oldPr) {
      changes.push(`Nova PR #${currentPr.number}: ${currentPr.title}`);
      continue;
    }

    if (oldPr.statusGeral !== currentPr.statusGeral) {
      changes.push(
        `PR #${currentPr.number}: ${statusLabel(oldPr.statusGeral)} -> ${statusLabel(currentPr.statusGeral)}`
      );
    }
  }

  for (const [id, oldPr] of previousById) {
    if (!nextById.has(id)) {
      changes.push(`PR #${oldPr.number} saiu da lista monitorada`);
    }
  }

  return changes;
}
