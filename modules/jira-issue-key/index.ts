/**
 * Chave de issue Jira (JOR-xxx): extração, normalização e URLs compartilhadas.
 * Seguro para Client Components. Para sync/cache PR, use `@/modules/jira-issue-key/server`.
 */

export {
  extractJiraIssueKey,
  getJiraAppIssueHref,
  getJiraBrowseUrl,
  linkifyJiraIssueKeysInMarkdown,
  normalizeJiraIssueKey,
  resolvePrTitleHref
} from "@/modules/jira-issue-key/lib/issue-key";

export { extractJiraIssueKeyFromBranch } from "@/modules/jira-issue-key/lib/issue-key-branch";

export { postgresWordBoundaryPattern, textMentionsIssueKey } from "@/modules/jira-issue-key/lib/issue-key-text";

export type { JiraIssueKeySource } from "@/modules/jira-issue-key/lib/issue-key-sources";

export { collectJiraIssueKeysFromTexts } from "@/modules/jira-issue-key/lib/issue-key-sources";
