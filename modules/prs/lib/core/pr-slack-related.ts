import { extractJiraIssueKey } from "@/modules/jira-issue-key";
import type { MonitoredPr } from "@/modules/prs/lib/domain";

export type SlackRelatedPr = Pick<MonitoredPr, "id" | "number" | "title" | "url" | "repository" | "slackShare">;

export function findOpenPrsByJiraIssueKey(prs: MonitoredPr[], issueKey: string): SlackRelatedPr[] {
  const normalizedKey = issueKey.trim().toUpperCase();

  return prs
    .filter((pr) => extractJiraIssueKey(pr.title) === normalizedKey)
    .map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      repository: pr.repository,
      slackShare: pr.slackShare ?? null
    }))
    .sort((a, b) => {
      const repoCompare = a.repository.localeCompare(b.repository, "pt-BR");
      if (repoCompare !== 0) {
        return repoCompare;
      }
      return a.number - b.number;
    });
}

/** Rótulo do ticket no canal (JOR-xxx - resumo), derivado do título de referência. */
export function resolveSlackTicketChannelLabel(referenceTitle: string, issueKey: string): string {
  const trimmed = referenceTitle.trim();
  const keyPattern = new RegExp(`^${issueKey.replace("-", "\\-")}\\s*[-–:]?\\s*`, "i");
  const summary = trimmed.replace(keyPattern, "").trim();

  if (summary && summary !== trimmed) {
    return `${issueKey} - ${summary}`;
  }

  return trimmed || issueKey;
}
