import type {
  DailySummaryPrContext,
  DailySummaryPrItem,
  DailySummaryPrMergedItem,
  DailySummaryPrStatusChange,
  DailySummaryQueueItem,
  DailySummaryReviewEvent,
  DailySummaryReviewItem
} from "@/modules/notebook-day/lib/types";
import { localCalendarDateOnly } from "@/modules/journal/lib/notebook-day";
import type {
  MonitoredPr,
  PrReviewContextRecord,
  PrTimelineEventRecord,
  PrTimelineReviewPayload,
  PrTimelineStatusPayload,
  ReviewerQueuePr
} from "@/modules/prs/lib/domain";
import {
  hasPrCache,
  loadPrMonitorCache,
  loadPrReviewContextCache,
  loadPrReviewerQueueCache
} from "@/modules/prs/lib/pr-cache-repository";
import { extractJiraIssueKey } from "@/modules/jira-issue-key";
import { listPrTimelineEventsByNotebookDay } from "@/modules/prs/lib/pr-timeline-repository";

function isSubmittedOnNotebookDay(submittedAt: string, day: string): boolean {
  const parsed = Date.parse(submittedAt);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return localCalendarDateOnly(new Date(parsed)) === day;
}

function buildImpediments(pr: MonitoredPr): string[] {
  const impediments: string[] = [];
  if (pr.hasConflicts) {
    impediments.push("conflitos de merge");
  }
  if (pr.hasUnresolvedComments) {
    impediments.push("comentários não resolvidos");
  }
  return impediments;
}

function mapOpenPr(pr: MonitoredPr, statusChangedOnDay: boolean): DailySummaryPrItem {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repository: pr.repository,
    statusGeral: pr.statusGeral,
    readyToMerge: pr.readyToMerge,
    jiraIssueKey: extractJiraIssueKey(pr.title),
    aprovou: pr.aprovou,
    solicitouAlteracoes: pr.solicitouAlteracoes,
    pendente: pr.pendente,
    impediments: buildImpediments(pr),
    statusChangedOnDay: statusChangedOnDay || undefined
  };
}

function mapPendingReview(pr: ReviewerQueuePr): DailySummaryQueueItem {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repository: pr.repository,
    myReviewStatus: "pending",
    jiraIssueKey: extractJiraIssueKey(pr.title)
  };
}

function reviewDedupeKey(prNumber: number, reviewerLogin: string, submittedAt: string): string {
  return `${prNumber}|${reviewerLogin}|${submittedAt}`;
}

function mapTimelineReviewToGiven(event: PrTimelineEventRecord): DailySummaryReviewItem {
  const payload = event.payload as PrTimelineReviewPayload;
  return {
    prNumber: event.prNumber,
    prTitle: event.prTitle,
    repository: event.repository,
    state: payload.state,
    submittedAt: event.occurredAt,
    jiraIssueKey: event.jiraIssueKey
  };
}

function mapTimelineReviewToReceived(event: PrTimelineEventRecord): DailySummaryReviewEvent {
  const payload = event.payload as PrTimelineReviewPayload;
  return {
    prNumber: event.prNumber,
    prTitle: event.prTitle,
    repository: event.repository,
    reviewerLogin: payload.reviewerLogin,
    state: payload.state,
    submittedAt: event.occurredAt,
    jiraIssueKey: event.jiraIssueKey
  };
}

function eventsToSummarySlices(
  events: PrTimelineEventRecord[],
  githubLogin: string
): {
  reviewsGivenToday: DailySummaryReviewItem[];
  reviewsReceivedToday: DailySummaryReviewEvent[];
  statusChangesToday: DailySummaryPrStatusChange[];
  mergesToday: DailySummaryPrMergedItem[];
  statusChangedPrNumbers: Set<number>;
} {
  const reviewsGivenToday: DailySummaryReviewItem[] = [];
  const reviewsReceivedToday: DailySummaryReviewEvent[] = [];
  const statusChangesToday: DailySummaryPrStatusChange[] = [];
  const mergesToday: DailySummaryPrMergedItem[] = [];
  const statusChangedPrNumbers = new Set<number>();
  const seenReviews = new Set<string>();

  for (const event of events) {
    if (event.eventType === "review_submitted") {
      const payload = event.payload as PrTimelineReviewPayload;
      const dedupe = reviewDedupeKey(event.prNumber, payload.reviewerLogin, event.occurredAt);
      if (seenReviews.has(dedupe)) {
        continue;
      }
      seenReviews.add(dedupe);

      if (payload.reviewerLogin === githubLogin) {
        reviewsGivenToday.push(mapTimelineReviewToGiven(event));
      }
      if (payload.authorLogin === githubLogin && payload.reviewerLogin !== githubLogin) {
        reviewsReceivedToday.push(mapTimelineReviewToReceived(event));
      }
      continue;
    }

    if (event.eventType === "status_changed") {
      const payload = event.payload as PrTimelineStatusPayload;
      statusChangedPrNumbers.add(event.prNumber);
      statusChangesToday.push({
        prNumber: event.prNumber,
        prTitle: event.prTitle,
        repository: event.repository,
        previousStatus: payload.previousStatus,
        nextStatus: payload.nextStatus,
        occurredAt: event.occurredAt,
        jiraIssueKey: event.jiraIssueKey
      });
      continue;
    }

    if (event.eventType === "pr_merged") {
      mergesToday.push({
        prNumber: event.prNumber,
        prTitle: event.prTitle,
        repository: event.repository,
        occurredAt: event.occurredAt,
        jiraIssueKey: event.jiraIssueKey
      });
    }
  }

  reviewsGivenToday.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  reviewsReceivedToday.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  statusChangesToday.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  mergesToday.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return {
    reviewsGivenToday,
    reviewsReceivedToday,
    statusChangesToday,
    mergesToday,
    statusChangedPrNumbers
  };
}

/** Fallback quando a timeline ainda não tem eventos (pré-migração ou primeiro sync). */
function collectReviewsForDayFromCache(
  records: PrReviewContextRecord[],
  day: string,
  githubLogin: string,
  seenReviews: Set<string>
): {
  reviewsGivenToday: DailySummaryReviewItem[];
  reviewsReceivedToday: DailySummaryReviewEvent[];
} {
  const reviewsGivenToday: DailySummaryReviewItem[] = [];
  const reviewsReceivedToday: DailySummaryReviewEvent[] = [];

  for (const pr of records) {
    const jiraIssueKey = extractJiraIssueKey(pr.title);

    for (const review of pr.reviews) {
      if (!isSubmittedOnNotebookDay(review.submittedAt, day)) {
        continue;
      }

      const dedupe = reviewDedupeKey(pr.number, review.login, review.submittedAt);
      if (seenReviews.has(dedupe)) {
        continue;
      }
      seenReviews.add(dedupe);

      if (review.login === githubLogin) {
        reviewsGivenToday.push({
          prNumber: pr.number,
          prTitle: pr.title,
          repository: pr.repository,
          state: review.state,
          submittedAt: review.submittedAt,
          jiraIssueKey
        });
      }

      if (pr.authorLogin === githubLogin && review.login !== githubLogin) {
        reviewsReceivedToday.push({
          prNumber: pr.number,
          prTitle: pr.title,
          repository: pr.repository,
          reviewerLogin: review.login,
          state: review.state,
          submittedAt: review.submittedAt,
          jiraIssueKey
        });
      }
    }
  }

  reviewsGivenToday.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  reviewsReceivedToday.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return { reviewsGivenToday, reviewsReceivedToday };
}

export async function buildDailySummaryPrContext(day: string): Promise<DailySummaryPrContext | null> {
  if (!(await hasPrCache())) {
    return null;
  }

  const monitor = await loadPrMonitorCache();
  if (!monitor) {
    return null;
  }

  const [queue, reviewContext, timelineEvents] = await Promise.all([
    loadPrReviewerQueueCache(),
    loadPrReviewContextCache(),
    listPrTimelineEventsByNotebookDay(monitor.githubLogin, day)
  ]);

  const pendingReviews = (queue?.data ?? [])
    .filter((pr) => pr.myReviewStatus === "pending")
    .map(mapPendingReview);

  const {
    reviewsGivenToday,
    reviewsReceivedToday,
    statusChangesToday,
    mergesToday,
    statusChangedPrNumbers
  } = eventsToSummarySlices(timelineEvents, monitor.githubLogin);

  const seenReviews = new Set([
    ...reviewsGivenToday.map((item) =>
      reviewDedupeKey(item.prNumber, monitor.githubLogin, item.submittedAt)
    ),
    ...reviewsReceivedToday.map((item) =>
      reviewDedupeKey(item.prNumber, item.reviewerLogin, item.submittedAt)
    )
  ]);

  const cacheReviews = collectReviewsForDayFromCache(
    reviewContext?.data ?? [],
    day,
    monitor.githubLogin,
    seenReviews
  );

  return {
    githubLogin: monitor.githubLogin,
    syncedAt: monitor.fetchedAt,
    myOpenPrs: monitor.data.map((pr) => mapOpenPr(pr, statusChangedPrNumbers.has(pr.number))),
    reviewsGivenToday: [...reviewsGivenToday, ...cacheReviews.reviewsGivenToday],
    reviewsReceivedToday: [...reviewsReceivedToday, ...cacheReviews.reviewsReceivedToday],
    pendingReviews,
    statusChangesToday,
    mergesToday
  };
}

/** Insumo de PR no dia: review, merge ou mudança de status nas suas PRs. */
export function prContextHasSummaryInput(pr: DailySummaryPrContext | null | undefined): boolean {
  if (!pr) {
    return false;
  }
  return (
    pr.reviewsGivenToday.length > 0 ||
    pr.reviewsReceivedToday.length > 0 ||
    pr.mergesToday.length > 0 ||
    pr.statusChangesToday.length > 0
  );
}
