import { extractJiraIssueKeyFromBranch } from "@/modules/jira-issue-key/lib/issue-key-branch";

export function buildOpenPrTitle(issueKey: string, jiraSummary: string): string {
  const summary = jiraSummary.trim();
  return summary.length > 0 ? `${issueKey} - ${summary}` : issueKey;
}

export function resolveIssueKeyForBranch(branch: string): string | null {
  return extractJiraIssueKeyFromBranch(branch);
}
