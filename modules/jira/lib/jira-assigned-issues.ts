import type { JiraIssueDto } from "@/modules/jira/lib/domain";
import { buildJiraIssuesResponse, hasJiraCache } from "@/modules/jira/lib/jira-cache-repository";
import { isJiraConfigured } from "@/modules/jira/lib/jira-config";
import { fetchAssignedJiraIssues, fetchJiraIssueIdsByKeys } from "@/modules/jira/lib/jira-service";
import type { JiraSprintFilter } from "@/modules/jira/lib/jira-jql";

const OPEN_PR_SPRINT_FILTERS: JiraSprintFilter[] = ["open", "all"];
const OPEN_PR_BRANCH_SPRINT_FILTERS: JiraSprintFilter[] = ["open"];
const OPEN_PR_MAX_BRANCH_ISSUES = 25;

export type JiraAssignedIssueRef = {
  id: string;
  key: string;
  summary: string;
};

function dedupeIssues(issues: JiraIssueDto[]): JiraIssueDto[] {
  const byKey = new Map<string, JiraIssueDto>();
  for (const issue of issues) {
    const key = issue.key.trim().toUpperCase();
    if (!key) {
      continue;
    }
    if (!byKey.has(key)) {
      byKey.set(key, issue);
    }
  }
  return [...byKey.values()];
}

async function loadIssuesFromCache(sprintFilters: JiraSprintFilter[]): Promise<JiraIssueDto[]> {
  const collected: JiraIssueDto[] = [];

  for (const sprintFilter of sprintFilters) {
    const response = await buildJiraIssuesResponse(sprintFilter);
    if (response?.issues.length) {
      collected.push(...response.issues);
    }
  }

  return dedupeIssues(collected);
}

async function loadIssuesLive(sprintFilters: JiraSprintFilter[]): Promise<JiraIssueDto[]> {
  const collected: JiraIssueDto[] = [];

  for (const sprintFilter of sprintFilters) {
    const response = await fetchAssignedJiraIssues({ sprintFilter, maxResults: 50 });
    collected.push(...response.issues);
  }

  return dedupeIssues(collected);
}

async function resolveIssueIds(issues: JiraIssueDto[]): Promise<JiraAssignedIssueRef[]> {
  const missingKeys = issues
    .filter((issue) => !issue.id?.trim())
    .map((issue) => issue.key.trim().toUpperCase());

  const fetchedIds = missingKeys.length > 0 ? await fetchJiraIssueIdsByKeys(missingKeys) : new Map();

  const resolved: JiraAssignedIssueRef[] = [];

  for (const issue of issues) {
    const key = issue.key.trim().toUpperCase();
    const id = issue.id?.trim() || fetchedIds.get(key);
    if (!key || !id) {
      continue;
    }
    resolved.push({
      id,
      key,
      summary: issue.summary
    });
  }

  return resolved;
}

export async function listAssignedJiraIssuesForDevStatus(): Promise<JiraAssignedIssueRef[]> {
  if (!isJiraConfigured()) {
    return [];
  }

  const issues = (await hasJiraCache())
    ? await loadIssuesFromCache(OPEN_PR_SPRINT_FILTERS)
    : await loadIssuesLive(OPEN_PR_SPRINT_FILTERS);
  return resolveIssueIds(issues);
}

/** Tickets da sprint aberta, limitados — usado na descoberta de branches (abrir PR). */
export async function listAssignedJiraIssuesForOpenPr(): Promise<JiraAssignedIssueRef[]> {
  if (!isJiraConfigured()) {
    return [];
  }

  const issues = (await hasJiraCache())
    ? await loadIssuesFromCache(OPEN_PR_BRANCH_SPRINT_FILTERS)
    : await loadIssuesLive(OPEN_PR_BRANCH_SPRINT_FILTERS);
  const resolved = await resolveIssueIds(issues);
  return resolved.slice(0, OPEN_PR_MAX_BRANCH_ISSUES);
}
