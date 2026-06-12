import { getJiraBrowseUrl } from "@/modules/jira-issue-key";
import { getJiraEmail } from "@/modules/jira/lib/jira-config";
import { jiraFetch } from "@/modules/jira/lib/jira-client";
import { buildAssignedIssuesJql, type JiraSprintFilter } from "@/modules/jira/lib/jira-jql";
import type { JiraIssueDto, JiraIssuesResponse } from "@/modules/jira/lib/domain";

const ISSUE_FIELDS = ["summary", "status", "priority", "issuetype", "updated"] as const;

const ISSUE_ID_LOOKUP_FIELDS = ["summary"] as const;

type JiraNamedField = {
  name: string;
  statusCategory?: { key: string };
};

type JiraSearchIssue = {
  key: string;
  fields: {
    summary: string;
    status: JiraNamedField;
    priority?: JiraNamedField | null;
    issuetype: JiraNamedField;
    updated: string;
  };
};

type JiraSearchJqlResponse = {
  issues: JiraSearchIssue[];
  isLast?: boolean;
  nextPageToken?: string;
};

type JiraMyselfResponse = {
  emailAddress?: string;
  displayName?: string;
};

type JiraSearchIssueWithId = JiraSearchIssue & { id?: string };

function mapIssue(issue: JiraSearchIssueWithId): JiraIssueDto {
  return {
    id: issue.id?.trim() || undefined,
    key: issue.key,
    summary: issue.fields.summary,
    statusName: issue.fields.status.name,
    statusCategoryKey: issue.fields.status.statusCategory?.key ?? "undefined",
    issueTypeName: issue.fields.issuetype.name,
    priorityName: issue.fields.priority?.name ?? null,
    updated: issue.fields.updated,
    browseUrl: getJiraBrowseUrl(issue.key)
  };
}

export async function fetchAssignedJiraIssues(
  options: { maxResults?: number; sprintFilter?: JiraSprintFilter } = {}
): Promise<JiraIssuesResponse> {
  const { maxResults = 50, sprintFilter = "all" } = options;
  const email = getJiraEmail() ?? "";

  let displayName: string | null = null;
  try {
    const myself = await jiraFetch<JiraMyselfResponse>("/myself");
    displayName = myself.displayName?.trim() || null;
  } catch {
    displayName = null;
  }

  const search = await jiraFetch<JiraSearchJqlResponse>("/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql: buildAssignedIssuesJql(sprintFilter),
      maxResults,
      fields: [...ISSUE_FIELDS]
    })
  });

  return {
    email,
    displayName,
    sprintFilter,
    issues: (search.issues ?? []).map(mapIssue),
    cachedAt: null
  };
}

export async function fetchJiraIssueIdsByKeys(issueKeys: string[]): Promise<Map<string, string>> {
  const uniqueKeys = [...new Set(issueKeys.map((key) => key.trim().toUpperCase()).filter(Boolean))];
  const resolved = new Map<string, string>();

  if (uniqueKeys.length === 0) {
    return resolved;
  }

  const chunkSize = 50;
  for (let index = 0; index < uniqueKeys.length; index += chunkSize) {
    const chunk = uniqueKeys.slice(index, index + chunkSize);
    const jql = `key in (${chunk.join(",")})`;
    const search = await jiraFetch<JiraSearchJqlResponse & { issues?: JiraSearchIssueWithId[] }>(
      "/search/jql",
      {
        method: "POST",
        body: JSON.stringify({
          jql,
          maxResults: chunk.length,
          fields: [...ISSUE_ID_LOOKUP_FIELDS]
        })
      }
    );

    for (const issue of search.issues ?? []) {
      const key = issue.key?.trim().toUpperCase();
      const id = issue.id?.trim();
      if (key && id) {
        resolved.set(key, id);
      }
    }
  }

  return resolved;
}
