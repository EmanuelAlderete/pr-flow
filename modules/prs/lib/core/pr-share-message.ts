import { extractJiraIssueKey, getJiraBrowseUrl } from "@/modules/prs/lib/core/jira-issue";

export function buildPrShareMessage(input: { title: string; url: string }): string {
  const issueKey = extractJiraIssueKey(input.title);
  const headline = issueKey
    ? `${input.title}: ${getJiraBrowseUrl(issueKey)}`
    : `${input.title}: ${input.url}`;

  return `${headline}\n\n- ${input.url}`;
}
