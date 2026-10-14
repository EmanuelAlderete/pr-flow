import { extractJiraIssueKey } from "@/modules/jira-issue-key/lib/issue-key";

export function textMentionsIssueKey(text: string, issueKey: string): boolean {
  if (extractJiraIssueKey(text) === issueKey) {
    return true;
  }
  const escaped = issueKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

