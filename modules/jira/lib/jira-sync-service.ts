import type { JiraSprintFilter } from "@/modules/jira/lib/jira-jql";
import { getJiraEmail, isJiraConfigured } from "@/modules/jira/lib/jira-config";
import {
  pruneJiraIssueDetails,
  pruneJiraIssuesCache,
  saveJiraIssueDetail,
  saveJiraIssuesCache,
  saveJiraSprintsCache,
  saveJiraSyncMeta
} from "@/modules/jira/lib/jira-cache-repository";
import { fetchJiraIssueDetail } from "@/modules/jira/lib/jira-issue-detail-service";
import { fetchAssignedJiraIssues } from "@/modules/jira/lib/jira-service";
import { fetchJiraSprints } from "@/modules/jira/lib/jira-sprint-service";
import type { JiraIssueKeySource } from "@/modules/jira-issue-key";
import { createPrMonitorCacheIssueKeySource } from "@/modules/jira-issue-key/server";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";

const ISSUE_DETAIL_CONCURRENCY = 4;
const JIRA_SYNC_LOG_SOURCE = "jira:sync";

export type JiraSyncResult = {
  status: "ok" | "skipped" | "error";
  issueDetailCount: number;
  sprintFilterCount: number;
  error?: string;
};

function buildSprintFilters(sprintIds: number[]): JiraSprintFilter[] {
  return ["all", "open", ...sprintIds.map((id) => String(id))];
}

async function syncIssueDetails(issueKeys: string[]): Promise<void> {
  const uniqueKeys = [...new Set(issueKeys.map((key) => key.trim().toUpperCase()).filter(Boolean))];
  const failed: string[] = [];

  for (let index = 0; index < uniqueKeys.length; index += ISSUE_DETAIL_CONCURRENCY) {
    const batch = uniqueKeys.slice(index, index + ISSUE_DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (issueKey) => {
        try {
          const detail = await fetchJiraIssueDetail(issueKey);
          const { cachedAt: _cachedAt, ...payload } = detail;
          await saveJiraIssueDetail(issueKey, payload);
        } catch {
          failed.push(issueKey);
        }
      })
    );
  }

  await pruneJiraIssueDetails(uniqueKeys);

  if (failed.length > 0) {
    writeSystemLogFireAndForget({
      level: "warn",
      source: JIRA_SYNC_LOG_SOURCE,
      message: `Falha ao sincronizar detalhes de ${failed.length} issues.`,
      details: { failed, total: uniqueKeys.length }
    });
  }
}

export type SyncJiraCacheOptions = {
  issueKeySource?: JiraIssueKeySource;
};

export async function syncJiraCache(options?: SyncJiraCacheOptions): Promise<JiraSyncResult> {
  const issueKeySource = options?.issueKeySource ?? createPrMonitorCacheIssueKeySource();
  if (!isJiraConfigured()) {
    return { status: "skipped", issueDetailCount: 0, sprintFilterCount: 0 };
  }

  const email = getJiraEmail() ?? "";
  let displayName: string | null = null;
  const detailKeys = new Set<string>();

  try {
    const sprintsPayload = await fetchJiraSprints();
    const { cachedAt: _sprintsCachedAt, ...sprintsToStore } = sprintsPayload;
    await saveJiraSprintsCache(sprintsToStore);

    const sprintFilters = buildSprintFilters(sprintsPayload.sprints.map((sprint) => sprint.id));
    let issuesMetaEmail = email;
    let issuesMetaDisplayName: string | null = null;

    for (const sprintFilter of sprintFilters) {
      const issuesPayload = await fetchAssignedJiraIssues({ sprintFilter });
      const { cachedAt: _issuesCachedAt, ...issuesToStore } = issuesPayload;
      await saveJiraIssuesCache(sprintFilter, issuesToStore.issues);

      issuesMetaEmail = issuesPayload.email;
      issuesMetaDisplayName = issuesPayload.displayName;
      displayName = issuesPayload.displayName;

      for (const issue of issuesPayload.issues) {
        detailKeys.add(issue.key);
      }
    }

    await pruneJiraIssuesCache(sprintFilters);

    for (const key of await issueKeySource.collectIssueKeys()) {
      detailKeys.add(key);
    }

    await syncIssueDetails([...detailKeys]);

    await saveJiraSyncMeta({
      email: issuesMetaEmail || email,
      displayName: issuesMetaDisplayName ?? displayName,
      status: "ok",
      error: null
    });

    return {
      status: "ok",
      issueDetailCount: detailKeys.size,
      sprintFilterCount: sprintFilters.length
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na sincronização do Jira.";

    await saveJiraSyncMeta({
      email,
      displayName,
      status: "error",
      error: message
    });

    writeSystemLogFireAndForget({
      level: "error",
      source: JIRA_SYNC_LOG_SOURCE,
      message,
      details: sanitizeErrorForLog(error)
    });

    return {
      status: "error",
      issueDetailCount: 0,
      sprintFilterCount: 0,
      error: message
    };
  }
}
