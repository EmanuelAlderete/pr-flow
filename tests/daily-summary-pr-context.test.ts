import { beforeEach, describe, expect, it, vi } from "vitest";

const hasPrCache = vi.fn();
const loadPrMonitorCache = vi.fn();
const loadPrReviewerQueueCache = vi.fn();
const loadPrReviewContextCache = vi.fn();
const listPrTimelineEventsByNotebookDay = vi.fn();

vi.mock("@/modules/prs/lib/pr-cache-repository", () => ({
  hasPrCache: (...args: unknown[]) => hasPrCache(...args),
  loadPrMonitorCache: (...args: unknown[]) => loadPrMonitorCache(...args),
  loadPrReviewerQueueCache: (...args: unknown[]) => loadPrReviewerQueueCache(...args),
  loadPrReviewContextCache: (...args: unknown[]) => loadPrReviewContextCache(...args)
}));

vi.mock("@/modules/prs/lib/pr-timeline-repository", () => ({
  listPrTimelineEventsByNotebookDay: (...args: unknown[]) => listPrTimelineEventsByNotebookDay(...args)
}));

describe("buildDailySummaryPrContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cache is not ready", async () => {
    hasPrCache.mockResolvedValue(false);
    const { buildDailySummaryPrContext } = await import(
      "@/modules/dashboard/lib/daily-summary-pr-context"
    );
    expect(await buildDailySummaryPrContext("2026-05-28")).toBeNull();
  });

  it("maps open PRs, pending queue and reviews on notebook day", async () => {
    hasPrCache.mockResolvedValue(true);
    loadPrMonitorCache.mockResolvedValue({
      githubLogin: "rigon",
      fetchedAt: "2026-05-28T20:00:00.000Z",
      data: [
        {
          id: "pr-1",
          number: 42,
          title: "JOR-123 Feature X",
          url: "https://github.com/acme/repo/pull/42",
          repository: "acme/repo",
          createdAt: "2026-05-20T10:00:00.000Z",
          avaliou: ["alice"],
          naoAvaliou: [],
          semReviewersSolicitados: false,
          aprovou: ["alice"],
          solicitouAlteracoes: [],
          pendente: [],
          requestedReviewersCount: 1,
          statusGeral: "approved",
          readyToMerge: true,
          hasConflicts: false,
          hasUnresolvedComments: false
        }
      ]
    });
    loadPrReviewerQueueCache.mockResolvedValue({
      githubLogin: "rigon",
      fetchedAt: "2026-05-28T20:00:00.000Z",
      data: [
        {
          id: "pr-2",
          number: 99,
          title: "Fix login",
          url: "https://github.com/acme/repo/pull/99",
          repository: "acme/repo",
          myReviewStatus: "pending"
        },
        {
          id: "pr-3",
          number: 100,
          title: "Already reviewed",
          url: "https://github.com/acme/repo/pull/100",
          repository: "acme/repo",
          myReviewStatus: "reviewed"
        }
      ]
    });
    loadPrReviewContextCache.mockResolvedValue({
      githubLogin: "rigon",
      fetchedAt: "2026-05-28T20:00:00.000Z",
      data: [
        {
          id: "pr-1",
          number: 42,
          title: "JOR-123 Feature X",
          url: "https://github.com/acme/repo/pull/42",
          repository: "acme/repo",
          authorLogin: "rigon",
          reviews: [
            {
              login: "alice",
              state: "APPROVED",
              submittedAt: "2026-05-28T14:30:00.000Z"
            }
          ]
        },
        {
          id: "pr-2",
          number: 99,
          title: "Fix login",
          url: "https://github.com/acme/repo/pull/99",
          repository: "acme/repo",
          authorLogin: "bob",
          reviews: [
            {
              login: "rigon",
              state: "APPROVED",
              submittedAt: "2026-05-28T16:00:00.000Z"
            }
          ]
        }
      ]
    });
    listPrTimelineEventsByNotebookDay.mockResolvedValue([
      {
        id: "evt-1",
        githubLogin: "rigon",
        notebookDay: "2026-05-28",
        occurredAt: "2026-05-28T14:30:00.000Z",
        eventType: "review_submitted",
        prId: "pr-1",
        prNumber: 42,
        prTitle: "JOR-123 Feature X",
        repository: "acme/repo",
        jiraIssueKey: "JOR-123",
        dedupeKey: "review:pr-1:alice",
        payload: { reviewerLogin: "alice", state: "APPROVED", authorLogin: "rigon" }
      },
      {
        id: "evt-2",
        githubLogin: "rigon",
        notebookDay: "2026-05-28",
        occurredAt: "2026-05-28T20:00:00.000Z",
        eventType: "status_changed",
        prId: "pr-1",
        prNumber: 42,
        prTitle: "JOR-123 Feature X",
        repository: "acme/repo",
        jiraIssueKey: "JOR-123",
        dedupeKey: "status:pr-1",
        payload: { previousStatus: "pending_review", nextStatus: "approved" }
      }
    ]);

    const { buildDailySummaryPrContext, prContextHasSummaryInput } = await import(
      "@/modules/dashboard/lib/daily-summary-pr-context"
    );
    const context = await buildDailySummaryPrContext("2026-05-28");

    expect(context?.myOpenPrs).toHaveLength(1);
    expect(context?.myOpenPrs[0]?.jiraIssueKey).toBe("JOR-123");
    expect(context?.pendingReviews).toHaveLength(1);
    expect(context?.pendingReviews[0]?.number).toBe(99);
    expect(context?.reviewsReceivedToday).toHaveLength(1);
    expect(context?.reviewsReceivedToday[0]?.reviewerLogin).toBe("alice");
    expect(context?.reviewsGivenToday).toHaveLength(1);
    expect(context?.reviewsGivenToday[0]?.prNumber).toBe(99);
    expect(context?.statusChangesToday).toHaveLength(1);
    expect(context?.myOpenPrs[0]?.statusChangedOnDay).toBe(true);
    expect(prContextHasSummaryInput(context)).toBe(true);
  });
});
