import type { JiraIssueDetailDto, JiraIssueDto } from "@/modules/jira/lib/domain";

export type WorkContextPullRequest = {
  number: number;
  title: string;
  repository: string;
  url: string;
  statusGeral: string;
};

export type WorkContextTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type WorkContextJournalMention = {
  notebookDay: string;
  excerpt: string;
};

export type WorkContextGapKind =
  | "open_pr_ticket_done"
  | "ticket_in_progress_no_activity"
  | "task_done_ticket_open";

export type WorkContextGapSeverity = "warning" | "info";

export type WorkContextGap = {
  kind: WorkContextGapKind;
  severity: WorkContextGapSeverity;
  message: string;
};

export type WorkContextGapInput = {
  jiraStatusCategoryKey: string | null;
  openPullRequests: WorkContextPullRequest[];
  tasks: WorkContextTask[];
  journalMentions: WorkContextJournalMention[];
};

export type WorkContext = {
  issueKey: string;
  jira: {
    summary: JiraIssueDto | null;
    detail: JiraIssueDetailDto | null;
  };
  pullRequests: WorkContextPullRequest[];
  tasks: WorkContextTask[];
  journalMentions: WorkContextJournalMention[];
  gaps: WorkContextGap[];
};
