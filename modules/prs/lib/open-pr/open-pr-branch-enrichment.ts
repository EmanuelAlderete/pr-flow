import { loadJiraIssueDetail } from "@/modules/jira/lib/jira-cache-repository";
import { buildOpenPrTitle, resolveIssueKeyForBranch } from "@/modules/prs/lib/open-pr/open-pr-title";
import type { OpenPrBranchItem } from "@/modules/prs/lib/open-pr/open-pr-types";

export async function resolveSuggestedTitleForBranch(
  branchName: string,
  fallbackIssueKey?: string | null,
  fallbackSummary?: string | null
): Promise<{
  issueKey: string | null;
  suggestedTitle: string | null;
  jiraSummary: string | null;
}> {
  const issueKey = resolveIssueKeyForBranch(branchName) ?? fallbackIssueKey ?? null;

  if (!issueKey) {
    return { issueKey: null, suggestedTitle: null, jiraSummary: fallbackSummary ?? null };
  }

  const summaryFromFallback = fallbackSummary?.trim();
  if (summaryFromFallback) {
    return {
      issueKey,
      suggestedTitle: buildOpenPrTitle(issueKey, summaryFromFallback),
      jiraSummary: summaryFromFallback
    };
  }

  const detail = await loadJiraIssueDetail(issueKey);
  const summary = detail?.summary?.trim() || null;
  if (!summary) {
    return { issueKey, suggestedTitle: issueKey, jiraSummary: null };
  }

  return {
    issueKey,
    suggestedTitle: buildOpenPrTitle(issueKey, summary),
    jiraSummary: summary
  };
}

export async function enrichOpenPrBranchItem(
  branchName: string,
  fallbackIssueKey?: string | null,
  fallbackSummary?: string | null
): Promise<OpenPrBranchItem> {
  const meta = await resolveSuggestedTitleForBranch(branchName, fallbackIssueKey, fallbackSummary);
  return {
    name: branchName,
    issueKey: meta.issueKey,
    suggestedTitle: meta.suggestedTitle,
    jiraSummary: meta.jiraSummary
  };
}

export function enrichOpenPrBranchItemsFromAssigned(
  entries: Array<{ branchName: string; issueKey: string; issueSummary: string }>
): OpenPrBranchItem[] {
  return entries
    .map((entry) => {
      const issueKey = resolveIssueKeyForBranch(entry.branchName) ?? entry.issueKey;
      const summary = entry.issueSummary.trim();
      return {
        name: entry.branchName,
        issueKey,
        suggestedTitle: summary ? buildOpenPrTitle(issueKey, summary) : issueKey,
        jiraSummary: summary || null
      } satisfies OpenPrBranchItem;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function enrichOpenPrBranchItems(
  entries: Array<{ branchName: string; issueKey?: string | null; issueSummary?: string | null }>
): Promise<OpenPrBranchItem[]> {
  const branches = await Promise.all(
    entries.map((entry) =>
      enrichOpenPrBranchItem(entry.branchName, entry.issueKey ?? null, entry.issueSummary ?? null)
    )
  );
  return branches.sort((a, b) => a.name.localeCompare(b.name));
}
