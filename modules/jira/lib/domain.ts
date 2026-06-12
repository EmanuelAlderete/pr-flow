export type JiraIssueDto = {
  /** ID numérico do Jira (Dev Status API). Opcional em caches antigos até o próximo sync. */
  id?: string;
  key: string;
  summary: string;
  statusName: string;
  statusCategoryKey: string;
  issueTypeName: string;
  priorityName: string | null;
  updated: string;
  browseUrl: string;
};

export type JiraSprintDto = {
  id: number;
  name: string;
  state: "active" | "future" | "closed";
  startDate: string | null;
  endDate: string | null;
};

export type JiraSprintsResponse = {
  boardId: number;
  boardName: string;
  projectKey: string;
  sprints: JiraSprintDto[];
  /** ISO — última sincronização com o Jira (cron). */
  cachedAt: string | null;
  /** Preenchido quando a última sincronização falhou mas há cache no banco. */
  syncWarning?: string;
};

export type JiraIssuesResponse = {
  email: string;
  displayName: string | null;
  sprintFilter: string;
  issues: JiraIssueDto[];
  cachedAt: string | null;
  /** Preenchido quando a última sincronização falhou mas há cache no banco. */
  syncWarning?: string;
};

export type JiraIssueCommentDto = {
  authorName: string | null;
  created: string | null;
  body: string;
};

export type JiraIssueTimeProgressDto = {
  estimateSeconds: number;
  spentSeconds: number;
  remainingSeconds: number | null;
  estimateLabel: string;
  spentLabel: string;
  remainingLabel: string | null;
  /** 0–100+ (gasto ÷ estimativa × 100) */
  percent: number;
};

export type JiraIssueDetailDto = {
  key: string;
  summary: string;
  description: string | null;
  figmaUrls: string[];
  hours: string | null;
  timeProgress: JiraIssueTimeProgressDto | null;
  latestComment: JiraIssueCommentDto | null;
  browseUrl: string;
  cachedAt: string | null;
};
