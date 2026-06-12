import { hasPrCache, loadPrMonitorCache } from "@/modules/prs/lib/pr-cache-repository";
import type { MonitoredPr } from "@/modules/prs/lib/domain";
import { normalizeJiraIssueKey, textMentionsIssueKey } from "@/modules/jira-issue-key";
import type { WorkContextPullRequest } from "@/modules/work-context/lib/domain";

function mapPullRequest(pr: MonitoredPr): WorkContextPullRequest {
  return {
    number: pr.number,
    title: pr.title,
    repository: pr.repository,
    url: pr.url,
    statusGeral: pr.statusGeral
  };
}

export async function loadWorkContextPullRequests(
  issueKeyInput: string
): Promise<WorkContextPullRequest[]> {
  const issueKey = normalizeJiraIssueKey(issueKeyInput);
  if (!(await hasPrCache())) {
    return [];
  }

  const cached = await loadPrMonitorCache();
  if (!cached) {
    return [];
  }

  return cached.data
    .filter((pr) => textMentionsIssueKey(pr.title, issueKey))
    .map(mapPullRequest);
}
