import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";
import {
  findJiraIssueInCache,
  loadJiraIssueDetail
} from "@/modules/jira/lib/jira-cache-repository";
import type { WorkContext } from "@/modules/work-context/lib/domain";
import { loadWorkContextJournalMentions } from "@/modules/work-context/lib/work-context-journal";
import { loadWorkContextPullRequests } from "@/modules/work-context/lib/work-context-pull-requests";
import { loadWorkContextTasks } from "@/modules/work-context/lib/work-context-tasks";
import { detectWorkContextGaps } from "@/modules/work-context/lib/work-context-gaps";

export async function buildWorkContext(issueKeyInput: string): Promise<WorkContext> {
  const issueKey = normalizeJiraIssueKey(issueKeyInput);
  const [summary, detail, pullRequests, tasks, journalMentions] = await Promise.all([
    findJiraIssueInCache(issueKey),
    loadJiraIssueDetail(issueKey),
    loadWorkContextPullRequests(issueKey),
    loadWorkContextTasks(issueKey),
    loadWorkContextJournalMentions(issueKey)
  ]);

  const gaps = detectWorkContextGaps({
    jiraStatusCategoryKey: summary?.statusCategoryKey ?? null,
    openPullRequests: pullRequests,
    tasks,
    journalMentions
  });

  return {
    issueKey,
    jira: {
      summary,
      detail
    },
    pullRequests,
    tasks,
    journalMentions,
    gaps
  };
}
