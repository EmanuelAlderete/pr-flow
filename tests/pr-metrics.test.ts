import { describe, expect, it } from "vitest";
import type { MonitoredPr, PrReviewContextRecord } from "@/modules/prs/lib/domain";
import {
  buildPrInsights,
  formatAverageOpenDays,
  formatAverageTimeToFirstReview
} from "@/modules/prs/lib/pr-metrics";

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

describe("buildPrInsights", () => {
  const now = new Date("2026-05-29T12:00:00Z");

  it("counts PRs cooling without any review after the threshold", () => {
    const insights = buildPrInsights({
      openPrs: [
        basePr({ id: "PR_1", createdAt: "2026-05-20T10:00:00Z", avaliou: [] }),
        basePr({ id: "PR_2", createdAt: "2026-05-28T10:00:00Z", avaliou: [] }),
        basePr({ id: "PR_3", createdAt: "2026-05-20T10:00:00Z", avaliou: ["ana"] })
      ],
      pendingReviewCount: 2,
      now,
      coolingDaysThreshold: 3
    });

    expect(insights.coolingPrCount).toBe(1);
    expect(insights.pendingReviewCount).toBe(2);
  });

  it("calculates average open time for current PRs", () => {
    const insights = buildPrInsights({
      openPrs: [
        basePr({ createdAt: "2026-05-26T12:00:00Z" }),
        basePr({ id: "PR_2", createdAt: "2026-05-28T12:00:00Z" })
      ],
      pendingReviewCount: 0,
      now
    });

    expect(insights.averageOpenDays).toBe(2);
  });

  it("returns null averages when there are no open PRs", () => {
    const insights = buildPrInsights({
      openPrs: [],
      pendingReviewCount: 0,
      now
    });

    expect(insights.openPrCount).toBe(0);
    expect(insights.averageOpenDays).toBeNull();
    expect(insights.averageTimeToFirstReviewHours).toBeNull();
  });

  it("calculates average time to first review when review context is available", () => {
    const openPrs = [basePr({ id: "PR_1", createdAt: "2026-05-28T10:00:00Z", avaliou: ["ana"] })];
    const reviewContext: PrReviewContextRecord[] = [
      {
        id: "PR_1",
        number: 1,
        title: "feat pagamentos",
        url: "https://github.com/acme/a/pull/1",
        repository: "acme/a",
        authorLogin: "rigon",
        reviews: [{ login: "ana", state: "APPROVED", submittedAt: "2026-05-28T16:00:00Z" }]
      }
    ];

    const insights = buildPrInsights({
      openPrs,
      pendingReviewCount: 0,
      reviewContext,
      now
    });

    expect(insights.averageTimeToFirstReviewHours).toBe(6);
  });
});

describe("formatAverageOpenDays", () => {
  it("formats day averages in pt-BR", () => {
    expect(formatAverageOpenDays(2)).toBe("2 dias");
    expect(formatAverageOpenDays(1)).toBe("1 dia");
    expect(formatAverageOpenDays(null)).toBe("—");
  });
});

describe("formatAverageTimeToFirstReview", () => {
  it("formats hours and days for first review latency", () => {
    expect(formatAverageTimeToFirstReview(6)).toBe("6 horas");
    expect(formatAverageTimeToFirstReview(30)).toBe("1,3 dias");
    expect(formatAverageTimeToFirstReview(null)).toBe("—");
  });
});
