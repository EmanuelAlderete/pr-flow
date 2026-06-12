import { JiraCacheNotReadyError } from "@/modules/jira/lib/jira-cache-errors";
import {
  buildJiraIssuesResponse,
  getJiraSyncMeta,
  hasJiraCache,
  loadJiraIssueDetail,
  loadJiraSprintsCache
} from "@/modules/jira/lib/jira-cache-repository";
import type {
  JiraIssueDetailDto,
  JiraIssuesResponse,
  JiraSprintsResponse
} from "@/modules/jira/lib/domain";
import type { JiraSprintFilter } from "@/modules/jira/lib/jira-jql";
import { isJiraConfigured, JiraConfigError } from "@/modules/jira/lib/jira-config";

async function assertJiraCacheReady(): Promise<void> {
  if (!isJiraConfigured()) {
    throw new JiraConfigError(
      "Configure JIRA_EMAIL e JIRA_TOKEN no .env para usar a integração com o Jira."
    );
  }

  if (!(await hasJiraCache())) {
    throw new JiraCacheNotReadyError();
  }
}

async function resolveSyncWarning(): Promise<string | undefined> {
  const meta = await getJiraSyncMeta();
  if (meta?.lastSyncStatus !== "error") {
    return undefined;
  }

  return (
    meta.lastSyncError?.trim() ||
    "Falha na última sincronização com o Jira. Os tickets exibidos podem estar desatualizados."
  );
}

export async function getJiraIssuesFromCache(
  sprintFilter: JiraSprintFilter
): Promise<JiraIssuesResponse> {
  await assertJiraCacheReady();

  const response = await buildJiraIssuesResponse(sprintFilter);
  if (!response) {
    throw new JiraCacheNotReadyError();
  }

  const syncWarning = await resolveSyncWarning();
  return syncWarning ? { ...response, syncWarning } : response;
}

export async function getJiraSprintsFromCache(): Promise<JiraSprintsResponse> {
  await assertJiraCacheReady();

  const sprints = await loadJiraSprintsCache();
  if (!sprints) {
    throw new JiraCacheNotReadyError();
  }

  const syncWarning = await resolveSyncWarning();
  return syncWarning ? { ...sprints, syncWarning } : sprints;
}

export async function getJiraIssueDetailFromCache(issueKey: string): Promise<JiraIssueDetailDto | null> {
  await assertJiraCacheReady();
  return loadJiraIssueDetail(issueKey);
}
