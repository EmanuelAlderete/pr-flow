import { localCalendarDateOnly } from "@/modules/journal/lib/notebook-day";
import type {
  MonitoredPr,
  PrReview,
  PrReviewContextRecord,
  PrTimelineEventInsert,
  PrTimelineEventType
} from "@/modules/prs/lib/domain";
import { extractJiraIssueKey } from "@/modules/prs/lib/core/jira-issue";

const VALID_REVIEW_STATES = new Set(["COMMENTED", "APPROVED", "CHANGES_REQUESTED"]);

function reviewFingerprint(review: PrReview): string {
  return `${review.login}|${review.submittedAt}|${review.state}`;
}

function buildReviewIndex(records: PrReviewContextRecord[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const pr of records) {
    index.set(pr.id, new Set(pr.reviews.map(reviewFingerprint)));
  }
  return index;
}

function parseOccurredAt(iso: string, fallback: Date): Date {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function baseEventFields(
  pr: Pick<PrReviewContextRecord, "id" | "number" | "title" | "repository">,
  eventType: PrTimelineEventType,
  occurredAt: Date,
  dedupeKey: string,
  githubLogin: string,
  payload: PrTimelineEventInsert["payload"]
): PrTimelineEventInsert {
  return {
    githubLogin,
    notebookDay: localCalendarDateOnly(occurredAt),
    occurredAt: occurredAt.toISOString(),
    eventType,
    prId: pr.id,
    prNumber: pr.number,
    prTitle: pr.title,
    repository: pr.repository,
    jiraIssueKey: extractJiraIssueKey(pr.title),
    payload,
    dedupeKey
  };
}

function detectReviewEvents(
  previous: PrReviewContextRecord[] | null,
  next: PrReviewContextRecord[],
  githubLogin: string,
  syncedAt: Date
): PrTimelineEventInsert[] {
  if (previous === null) {
    return [];
  }

  const previousIndex = buildReviewIndex(previous);
  const events: PrTimelineEventInsert[] = [];

  for (const pr of next) {
    const known = previousIndex.get(pr.id) ?? new Set();
    for (const review of pr.reviews) {
      if (!VALID_REVIEW_STATES.has(review.state)) {
        continue;
      }
      const fingerprint = reviewFingerprint(review);
      if (known.has(fingerprint)) {
        continue;
      }

      const occurredAt = parseOccurredAt(review.submittedAt, syncedAt);
      events.push(
        baseEventFields(pr, "review_submitted", occurredAt, `review:${pr.id}:${fingerprint}`, githubLogin, {
          reviewerLogin: review.login,
          state: review.state,
          authorLogin: pr.authorLogin
        })
      );
    }
  }

  return events;
}

function detectMonitorEvents(
  previous: MonitoredPr[] | null,
  next: MonitoredPr[],
  githubLogin: string,
  syncedAt: Date
): PrTimelineEventInsert[] {
  if (previous === null) {
    return [];
  }

  const previousById = new Map(previous.map((pr) => [pr.id, pr]));
  const nextById = new Map(next.map((pr) => [pr.id, pr]));
  const events: PrTimelineEventInsert[] = [];

  for (const [id, currentPr] of nextById) {
    const oldPr = previousById.get(id);
    if (!oldPr) {
      events.push(
        baseEventFields(currentPr, "pr_opened", syncedAt, `opened:${id}:${syncedAt.toISOString()}`, githubLogin, {})
      );
      continue;
    }

    if (oldPr.statusGeral !== currentPr.statusGeral) {
      events.push(
        baseEventFields(
          currentPr,
          "status_changed",
          syncedAt,
          `status:${id}:${oldPr.statusGeral}->${currentPr.statusGeral}:${syncedAt.toISOString()}`,
          githubLogin,
          { previousStatus: oldPr.statusGeral, nextStatus: currentPr.statusGeral }
        )
      );
    }
  }

  for (const [id, oldPr] of previousById) {
    if (!nextById.has(id)) {
      events.push(
        baseEventFields(oldPr, "pr_merged", syncedAt, `merged:${id}:${syncedAt.toISOString()}`, githubLogin, {})
      );
    }
  }

  return events;
}

export function detectPrTimelineEvents(input: {
  previousMonitor: MonitoredPr[] | null;
  nextMonitor: MonitoredPr[];
  previousReviewContext: PrReviewContextRecord[] | null;
  nextReviewContext: PrReviewContextRecord[];
  githubLogin: string;
  syncedAt?: Date;
}): PrTimelineEventInsert[] {
  const syncedAt = input.syncedAt ?? new Date();
  return [
    ...detectReviewEvents(input.previousReviewContext, input.nextReviewContext, input.githubLogin, syncedAt),
    ...detectMonitorEvents(input.previousMonitor, input.nextMonitor, input.githubLogin, syncedAt)
  ];
}
