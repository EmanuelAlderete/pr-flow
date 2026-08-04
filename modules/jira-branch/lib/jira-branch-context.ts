import { adfToPlainText, normalizePlainText } from "@/modules/jira/lib/jira-adf";
import { jiraFetch } from "@/modules/jira/lib/jira-client";
import { findJiraIssueInCache, loadJiraIssueDetail } from "@/modules/jira/lib/jira-cache-repository";

const RECENT_COMMENTS_LIMIT = 3;

export type JiraBranchNamingContext = {
  issueKey: string;
  summary: string;
  issueTypeName: string;
  description: string | null;
  comments: string[];
};

type JiraCommentNode = {
  created?: string;
  body?: unknown;
};

async function fetchRecentJiraCommentBodies(issueKey: string): Promise<string[]> {
  try {
    const payload = await jiraFetch<{
      fields?: { comment?: { comments?: JiraCommentNode[] } };
    }>(`/issue/${encodeURIComponent(issueKey)}?fields=comment`);

    const comments = payload.fields?.comment?.comments ?? [];
    const sorted = [...comments].sort((a, b) => {
      const aTime = Date.parse(a.created ?? "");
      const bTime = Date.parse(b.created ?? "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

    return sorted
      .map((comment) => normalizePlainText(adfToPlainText(comment.body)))
      .filter((body) => body.length > 0)
      .slice(0, RECENT_COMMENTS_LIMIT);
  } catch {
    return [];
  }
}

export async function loadJiraBranchNamingContext(
  issueKey: string
): Promise<JiraBranchNamingContext | null> {
  const normalizedKey = issueKey.trim().toUpperCase();
  const cachedIssue = await findJiraIssueInCache(normalizedKey);
  const cachedDetail = await loadJiraIssueDetail(normalizedKey);

  if (!cachedIssue && !cachedDetail) {
    return null;
  }

  const liveComments = await fetchRecentJiraCommentBodies(normalizedKey);
  const fallbackComments =
    cachedDetail?.latestComment?.body ? [cachedDetail.latestComment.body] : [];

  return {
    issueKey: normalizedKey,
    summary: cachedIssue?.summary ?? cachedDetail?.summary ?? normalizedKey,
    issueTypeName: cachedIssue?.issueTypeName ?? "Task",
    description: cachedDetail?.description ?? null,
    comments: liveComments.length > 0 ? liveComments : fallbackComments
  };
}
