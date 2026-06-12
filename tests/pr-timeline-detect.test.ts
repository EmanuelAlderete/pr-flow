import { describe, expect, it } from "vitest";
import { detectPrTimelineEvents } from "@/modules/prs/lib/pr-timeline-detect";
import type { MonitoredPr, PrReviewContextRecord } from "@/modules/prs/lib/domain";

const syncedAt = new Date("2026-05-28T20:00:00.000Z");

function baseMonitor(overrides: Partial<MonitoredPr> = {}): MonitoredPr {
  return {
    id: "pr-1",
    number: 42,
    title: "JOR-123 Feature",
    url: "https://github.com/acme/repo/pull/42",
    repository: "acme/repo",
    createdAt: "2026-05-20T10:00:00.000Z",
    avaliou: [],
    naoAvaliou: [],
    semReviewersSolicitados: false,
    aprovou: [],
    solicitouAlteracoes: [],
    pendente: ["alice"],
    requestedReviewersCount: 1,
    statusGeral: "pending_review",
    ...overrides
  };
}

function baseReviewContext(overrides: Partial<PrReviewContextRecord> = {}): PrReviewContextRecord {
  return {
    id: "pr-1",
    number: 42,
    title: "JOR-123 Feature",
    url: "https://github.com/acme/repo/pull/42",
    repository: "acme/repo",
    authorLogin: "rigon",
    reviews: [],
    ...overrides
  };
}

describe("detectPrTimelineEvents", () => {
  it("returns empty on first sync without previous snapshot", () => {
    expect(
      detectPrTimelineEvents({
        previousMonitor: null,
        nextMonitor: [baseMonitor()],
        previousReviewContext: null,
        nextReviewContext: [baseReviewContext()],
        githubLogin: "rigon",
        syncedAt
      })
    ).toEqual([]);
  });

  it("detects new review, status change and merge", () => {
    const previousMonitor = [baseMonitor({ statusGeral: "pending_review" })];
    const nextMonitor = [baseMonitor({ statusGeral: "approved", pendente: [], aprovou: ["alice"] })];
    const previousReviewContext = [baseReviewContext({ reviews: [] })];
    const nextReviewContext = [
      baseReviewContext({
        reviews: [{ login: "alice", state: "APPROVED", submittedAt: "2026-05-28T14:30:00.000Z" }]
      })
    ];

    const events = detectPrTimelineEvents({
      previousMonitor,
      nextMonitor,
      previousReviewContext,
      nextReviewContext,
      githubLogin: "rigon",
      syncedAt
    });

    expect(events.some((event) => event.eventType === "review_submitted")).toBe(true);
    expect(events.some((event) => event.eventType === "status_changed")).toBe(true);
    expect(events.find((event) => event.eventType === "review_submitted")?.notebookDay).toBe("2026-05-28");

    const removed = detectPrTimelineEvents({
      previousMonitor: [baseMonitor({ id: "gone", number: 7 })],
      nextMonitor: [],
      previousReviewContext: [baseReviewContext({ id: "gone", number: 7 })],
      nextReviewContext: [],
      githubLogin: "rigon",
      syncedAt
    });
    expect(removed.some((event) => event.eventType === "pr_merged")).toBe(true);
  });
});
