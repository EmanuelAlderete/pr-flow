/**
 * Seam server-only: fontes de chaves Jira (ex.: cache do PR monitor).
 * Não importar em Client Components — use `@/modules/jira-issue-key` para helpers puros.
 */

export type { JiraIssueKeySource } from "@/modules/jira-issue-key/lib/issue-key-sources";

export { createPrMonitorCacheIssueKeySource } from "@/modules/jira-issue-key/lib/pr-monitor-cache-issue-key-source";
