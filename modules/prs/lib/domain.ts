export type ReviewState = "COMMENTED" | "APPROVED" | "CHANGES_REQUESTED" | "DISMISSED" | string;

export interface PrReview {
  login: string;
  state: ReviewState;
  submittedAt: string;
}

export interface MonitoredPrRaw {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  createdAt: string;
  authorLogin?: string;
  requestedReviewers: string[];
  reviews: PrReview[];
  hasConflicts?: boolean;
  hasUnresolvedComments?: boolean;
}

export interface PrSlackShareInfo {
  sharedAt: string;
  channel: string;
}

export interface MonitoredPr {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  createdAt: string;
  avaliou: string[];
  naoAvaliou: string[];
  semReviewersSolicitados: boolean;
  aprovou: string[];
  solicitouAlteracoes: string[];
  pendente: string[];
  requestedReviewersCount: number;
  statusGeral: "approved" | "changes_requested" | "pending_review" | "no_reviewers";
  readyToMerge?: boolean;
  hasConflicts?: boolean;
  hasUnresolvedComments?: boolean;
  /** Preenchido na leitura do monitor quando a PR já foi enviada ao Slack. */
  slackShare?: PrSlackShareInfo | null;
  /** Última revisão local desta PR, quando existir. */
  localReview?: PrLocalReviewInfo | null;
}

export type PrLocalReviewFinding = {
  agent: string;
  path: string;
  line?: number;
  message: string;
  confidence: number;
};

export type PrLocalReviewInfo = {
  status: "running" | "ok" | "error";
  headSha: string;
  summary: string | null;
  findings: PrLocalReviewFinding[];
  startedAt?: string | null;
  finishedAt: string | null;
  error: string | null;
};

export type PrApiSuccess = {
  status: "ok";
  data: MonitoredPr[];
  fetchedAt: string;
  githubLogin: string;
};

export type PrApiUnauthenticated = {
  status: "unauthenticated";
  message: string;
};

export type PrApiError = {
  status: "error";
  message: string;
};

export type PrApiStale = {
  status: "stale";
  data: MonitoredPr[];
  fetchedAt: string;
  githubLogin: string;
  message: string;
};

export type PrApiResponse = PrApiSuccess | PrApiStale | PrApiUnauthenticated | PrApiError;

export type MyReviewStatus = "reviewed" | "pending" | "dismissed";

export interface ReviewerQueuePr {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  myReviewStatus: MyReviewStatus;
  /** Última revisão local desta PR, quando existir. */
  localReview?: PrLocalReviewInfo | null;
}

/** Minimal review snapshot persisted during sync for daily summaries. */
export interface PrReviewContextRecord {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: string;
  authorLogin: string;
  reviews: PrReview[];
}

export type PrTimelineEventType =
  | "review_submitted"
  | "status_changed"
  | "pr_merged"
  | "pr_opened";

export type PrTimelineReviewPayload = {
  reviewerLogin: string;
  state: string;
  authorLogin: string;
};

export type PrTimelineStatusPayload = {
  previousStatus: MonitoredPr["statusGeral"];
  nextStatus: MonitoredPr["statusGeral"];
};

export type PrTimelineEventPayload = PrTimelineReviewPayload | PrTimelineStatusPayload | Record<string, never>;

export interface PrTimelineEventRecord {
  id: string;
  githubLogin: string;
  notebookDay: string;
  occurredAt: string;
  eventType: PrTimelineEventType;
  prId: string;
  prNumber: number;
  prTitle: string;
  repository: string;
  jiraIssueKey: string | null;
  payload: PrTimelineEventPayload;
  dedupeKey: string;
}

export type PrTimelineEventInsert = Omit<PrTimelineEventRecord, "id">;

export type ReviewerQueueApiSuccess = {
  status: "ok";
  data: ReviewerQueuePr[];
  fetchedAt: string;
  githubLogin: string;
};

export type ReviewerQueueApiUnauthenticated = {
  status: "unauthenticated";
  message: string;
};

export type ReviewerQueueApiError = {
  status: "error";
  message: string;
};

export type ReviewerQueueApiStale = {
  status: "stale";
  data: ReviewerQueuePr[];
  fetchedAt: string;
  githubLogin: string;
  message: string;
};

export type ReviewerQueueApiResponse =
  | ReviewerQueueApiSuccess
  | ReviewerQueueApiStale
  | ReviewerQueueApiUnauthenticated
  | ReviewerQueueApiError;
