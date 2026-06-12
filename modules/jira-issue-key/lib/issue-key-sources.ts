import { extractJiraIssueKey } from "@/modules/jira-issue-key/lib/issue-key";

export type JiraIssueKeySource = {
  collectIssueKeys(): Promise<string[]>;
};

export function collectJiraIssueKeysFromTexts(texts: Iterable<string>): string[] {
  const keys = new Set<string>();

  for (const text of texts) {
    const key = extractJiraIssueKey(text);
    if (key) {
      keys.add(key);
    }
  }

  return [...keys];
}
