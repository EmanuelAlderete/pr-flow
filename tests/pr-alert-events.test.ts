import { describe, expect, it } from "vitest";
import type { MonitoredPr, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/modules/notifications/lib/notification-preferences";
import {
  detectPrMonitorAlerts,
  detectReviewerQueueAlerts
} from "@/modules/notifications/lib/pr-alert-events";

function basePr(overrides: Partial<MonitoredPr> = {}): MonitoredPr {
  return {
    id: "PR_1",
    number: 1,
    title: "feat pagamentos",
    url: "https://github.com/acme/a/pull/1",
    repository: "acme/a",
    createdAt: "2026-05-26T10:00:00Z",
    avaliou: [],
    naoAvaliou: ["ana"],
    semReviewersSolicitados: false,
    aprovou: [],
    solicitouAlteracoes: [],
    pendente: ["ana"],
    requestedReviewersCount: 1,
    statusGeral: "pending_review",
    ...overrides
  };
}

function queuePr(overrides: Partial<ReviewerQueuePr> = {}): ReviewerQueuePr {
  return {
    id: "PR_9",
    number: 9,
    title: "fix checkout",
    url: "https://github.com/acme/a/pull/9",
    repository: "acme/a",
    myReviewStatus: "pending",
    ...overrides
  };
}

describe("detectPrMonitorAlerts", () => {
  it("emits approved alert when status changes to approved", () => {
    const previous = [basePr({ statusGeral: "pending_review" })];
    const next = [basePr({ statusGeral: "approved", aprovou: ["ana"], pendente: [] })];

    const alerts = detectPrMonitorAlerts(previous, next, DEFAULT_NOTIFICATION_PREFERENCES);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("prApproved");
    expect(alerts[0]?.title).toMatch(/aprovada/i);
  });

  it("emits changes requested alert when status changes accordingly", () => {
    const previous = [basePr()];
    const next = [basePr({ statusGeral: "changes_requested", solicitouAlteracoes: ["ana"] })];

    const alerts = detectPrMonitorAlerts(previous, next, DEFAULT_NOTIFICATION_PREFERENCES);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("prChangesRequested");
  });

  it("respects disabled alert types", () => {
    const previous = [basePr()];
    const next = [basePr({ statusGeral: "approved", aprovou: ["ana"], pendente: [] })];
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      alerts: { ...DEFAULT_NOTIFICATION_PREFERENCES.alerts, prApproved: false }
    };

    expect(detectPrMonitorAlerts(previous, next, prefs)).toHaveLength(0);
  });

  it("emits stale alert for PRs open longer than threshold when enabled", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      alerts: { ...DEFAULT_NOTIFICATION_PREFERENCES.alerts, prStale: true },
      staleDaysThreshold: 3
    };
    const stalePr = basePr({
      createdAt: "2026-05-20T10:00:00Z",
      statusGeral: "pending_review"
    });
    const now = new Date("2026-05-29T12:00:00Z");

    const alerts = detectPrMonitorAlerts([stalePr], [stalePr], prefs, now);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("prStale");
  });

  it("skips alerts on first sync when previous snapshot is null", () => {
    const next = [basePr()];

    expect(detectPrMonitorAlerts(null, next, DEFAULT_NOTIFICATION_PREFERENCES)).toHaveLength(0);
  });
});

describe("detectReviewerQueueAlerts", () => {
  it("emits alert for new pending PR in reviewer queue", () => {
    const previous: ReviewerQueuePr[] = [];
    const next = [queuePr()];

    const alerts = detectReviewerQueueAlerts(previous, next, DEFAULT_NOTIFICATION_PREFERENCES);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("reviewerQueueNew");
    expect(alerts[0]?.body).toMatch(/fix checkout/i);
  });

  it("does not alert for PRs already in queue", () => {
    const pr = queuePr();
    const alerts = detectReviewerQueueAlerts([pr], [pr], DEFAULT_NOTIFICATION_PREFERENCES);

    expect(alerts).toHaveLength(0);
  });
});
