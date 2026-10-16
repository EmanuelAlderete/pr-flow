export type DailySummaryTaskItem = {
  title: string;
  description: string | null;
  dueDate: string | null;
  isOverdue?: boolean;
};

export type DailySummaryJiraItem = {
  key: string;
  summary: string;
  statusName: string;
  statusCategoryKey: string;
  issueTypeName: string;
  priorityName: string | null;
  updated: string;
  /** Ticket com campo `updated` no dia civil local. */
  updatedOnDay: boolean;
  hours: string | null;
  timeSpentLabel: string | null;
  estimateLabel: string | null;
  percentSpent: number | null;
};

export type DailySummaryJiraContext = {
  sprintLabel: string | null;
  issues: DailySummaryJiraItem[];
};

export type DailySummaryPrItem = {
  number: number;
  title: string;
  url: string;
  repository: string;
  statusGeral: "approved" | "changes_requested" | "pending_review" | "no_reviewers";
  readyToMerge?: boolean;
  jiraIssueKey: string | null;
  aprovou: string[];
  solicitouAlteracoes: string[];
  pendente: string[];
  impediments: string[];
  /** Status geral mudou neste dia (via timeline de sync). */
  statusChangedOnDay?: boolean;
};

export type DailySummaryPrStatusChange = {
  prNumber: number;
  prTitle: string;
  repository: string;
  previousStatus: DailySummaryPrItem["statusGeral"];
  nextStatus: DailySummaryPrItem["statusGeral"];
  occurredAt: string;
  jiraIssueKey: string | null;
};

export type DailySummaryPrMergedItem = {
  prNumber: number;
  prTitle: string;
  repository: string;
  occurredAt: string;
  jiraIssueKey: string | null;
};

export type DailySummaryReviewItem = {
  prNumber: number;
  prTitle: string;
  repository: string;
  state: string;
  submittedAt: string;
  jiraIssueKey: string | null;
};

export type DailySummaryReviewEvent = {
  prNumber: number;
  prTitle: string;
  repository: string;
  reviewerLogin: string;
  state: string;
  submittedAt: string;
  jiraIssueKey: string | null;
};

export type DailySummaryQueueItem = {
  number: number;
  title: string;
  url: string;
  repository: string;
  myReviewStatus: "pending";
  jiraIssueKey: string | null;
};

export type DailySummaryPrContext = {
  githubLogin: string | null;
  syncedAt: string | null;
  myOpenPrs: DailySummaryPrItem[];
  reviewsGivenToday: DailySummaryReviewItem[];
  reviewsReceivedToday: DailySummaryReviewEvent[];
  pendingReviews: DailySummaryQueueItem[];
  statusChangesToday: DailySummaryPrStatusChange[];
  mergesToday: DailySummaryPrMergedItem[];
};

/** Authored commit in a monitored repository. Message only — no diff. */
export type AuthoredCommit = {
  sha: string;
  message: string;
  repository: string;
  jiraIssueKey: string | null;
  pullRequestNumber: number | null;
};

export type StandupBeat = "yesterday" | "today" | "blocker";

export type GapFact = {
  beat: StandupBeat;
  answer: string;
};

export type DailySummaryContext = {
  day: string;
  noteBody: string | null;
  pendingTasks: DailySummaryTaskItem[];
  completedTodayTasks: DailySummaryTaskItem[];
  jira: DailySummaryJiraContext | null;
  prs: DailySummaryPrContext | null;
  /** Commits authored by the person on this civil day. Absent on older fixtures. */
  gitActivity?: AuthoredCommit[];
  /** Gap answers are facts. Mentoring readings stay out of this list. */
  gapFacts?: GapFact[];
  /** Person's reading of a career signal. Not a work fact. */
  mentoringReadings?: string[];
};

export type DailySummarySuccess = {
  status: "ok";
  day: string;
  summary: string;
  generatedAt: string;
};

export type DailySummaryMissingApiKey = {
  status: "missing_api_key";
  message: string;
};

export type DailySummaryError = {
  status: "error";
  message: string;
};

export type DailySummaryRateLimited = {
  status: "rate_limited";
  message: string;
};

export type DailySummaryNoInput = {
  status: "no_input";
  day: string;
  message: string;
};

export type DailySummaryNotGenerated = {
  status: "not_generated";
  day: string;
};

export type DailySummaryAlreadyExists = {
  status: "already_exists";
  day: string;
  message: string;
  summary: string;
  generatedAt: string;
};

export type DailySummaryResponse =
  | DailySummarySuccess
  | DailySummaryMissingApiKey
  | DailySummaryRateLimited
  | DailySummaryNoInput
  | DailySummaryNotGenerated
  | DailySummaryAlreadyExists
  | DailySummaryError;
