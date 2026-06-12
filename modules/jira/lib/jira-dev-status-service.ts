import { getJiraSiteOrigin, isJiraConfigured } from "@/modules/jira/lib/jira-config";
import type { JiraDevStatusBranchRef } from "@/modules/jira/lib/jira-dev-status-validation";
import { jiraDevStatusResponseSchema } from "@/modules/jira/lib/jira-dev-status-validation";
import { jiraFetch } from "@/modules/jira/lib/jira-client";

const GITHUB_APPLICATION_TYPE = "GitHub";
const EXCLUDED_PR_STATUSES = new Set(["MERGED"]);

function devStatusDetailUrl(issueId: string, dataType: "pullrequest" | "branch"): string {
  const params = new URLSearchParams({
    issueId,
    applicationType: GITHUB_APPLICATION_TYPE,
    dataType
  });
  return `${getJiraSiteOrigin()}/rest/dev-status/1.0/issue/detail?${params.toString()}`;
}

function normalizeRepositorySlug(value: string): string {
  return value.trim().toLowerCase();
}

function repositoriesMatch(expectedRepository: string, candidate: string | undefined): boolean {
  if (!candidate?.trim()) {
    return false;
  }
  return normalizeRepositorySlug(candidate) === normalizeRepositorySlug(expectedRepository);
}

function addBranchRef(
  target: Map<string, JiraDevStatusBranchRef>,
  branchName: string | undefined,
  repository: string | undefined,
  expectedRepository: string
): void {
  const normalizedBranch = branchName?.trim();
  if (!normalizedBranch || !repositoriesMatch(expectedRepository, repository)) {
    return;
  }

  const key = `${normalizeRepositorySlug(expectedRepository)}:${normalizedBranch}`;
  if (!target.has(key)) {
    target.set(key, {
      branchName: normalizedBranch,
      repository: expectedRepository
    });
  }
}

export function extractDevStatusBranchesForRepository(
  payload: unknown,
  expectedRepository: string
): JiraDevStatusBranchRef[] {
  const parsed = jiraDevStatusResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const collected = new Map<string, JiraDevStatusBranchRef>();

  for (const block of parsed.data.detail ?? []) {
    for (const branch of block.branches ?? []) {
      const branchName = branch.name?.trim();
      const repositoryFromUrl = branch.url?.match(/github\.com\/([^/]+\/[^/]+)\/tree\//i)?.[1];
      addBranchRef(
        collected,
        branchName,
        branch.repositoryName ?? repositoryFromUrl,
        expectedRepository
      );
    }

    for (const pullRequest of block.pullRequests ?? []) {
      const status = pullRequest.status?.trim().toUpperCase();
      if (status && EXCLUDED_PR_STATUSES.has(status)) {
        continue;
      }
      addBranchRef(
        collected,
        pullRequest.source?.branch,
        pullRequest.repositoryName,
        expectedRepository
      );
    }
  }

  return [...collected.values()].sort((a, b) => a.branchName.localeCompare(b.branchName));
}

export async function fetchJiraDevStatusDetail(
  issueId: string,
  dataType: "pullrequest" | "branch"
): Promise<unknown> {
  return jiraFetch<unknown>(devStatusDetailUrl(issueId, dataType));
}

export async function fetchJiraDevStatusBranchesForRepository(
  issueId: string,
  repository: string
): Promise<JiraDevStatusBranchRef[]> {
  const pullRequestPayload = await fetchJiraDevStatusDetail(issueId, "pullrequest");
  const fromPullRequests = extractDevStatusBranchesForRepository(pullRequestPayload, repository);

  if (fromPullRequests.length > 0) {
    return fromPullRequests;
  }

  const branchPayload = await fetchJiraDevStatusDetail(issueId, "branch");
  return extractDevStatusBranchesForRepository(branchPayload, repository);
}

export function isJiraDevStatusAvailable(): boolean {
  return isJiraConfigured();
}
