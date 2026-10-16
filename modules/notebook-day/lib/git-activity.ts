import { z } from "zod";
import { getGithubLogin } from "@/modules/app/lib/github-login-repository";
import type { AuthoredCommit } from "@/modules/notebook-day/lib/types";
import { defaultRunner, type CommandRunner } from "@/modules/prs/lib/gh-client";
import { listMonitoredRepositoriesForApp } from "@/modules/prs/lib/monitored-repositories-service";

const JIRA_KEY = /\b([A-Z][A-Z0-9]+-\d+)\b/;
const PULL_REQUEST_NUMBER = /#(\d+)\b/;

const ghCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    message: z.string()
  }),
  author: z
    .object({
      login: z.string().optional()
    })
    .nullish(),
  repository: z
    .object({
      nameWithOwner: z.string()
    })
    .nullish()
});

const ghCommitListSchema = z.array(ghCommitSchema);

export type RawAuthoredCommit = {
  sha: string;
  message: string;
  repository: string;
  authorLogin: string | null;
  diff?: string;
};

function firstMatch(pattern: RegExp, value: string): string | null {
  const match = pattern.exec(value);
  return match?.[1] ?? null;
}

function toAuthoredCommit(commit: RawAuthoredCommit): AuthoredCommit {
  const message = commit.message.trim().slice(0, 500);
  const pullRequest = firstMatch(PULL_REQUEST_NUMBER, message);
  return {
    sha: commit.sha,
    message,
    repository: commit.repository,
    jiraIssueKey: firstMatch(JIRA_KEY, message),
    pullRequestNumber: pullRequest ? Number(pullRequest) : null
  };
}

/**
 * Keeps commits authored by the person in a monitored repository.
 * Drops other authors, unlisted repositories, and any diff payload.
 */
export function selectAuthoredCommits(input: {
  commits: RawAuthoredCommit[];
  authorLogin: string;
  monitoredRepositories: string[];
}): AuthoredCommit[] {
  const allowed = new Set(input.monitoredRepositories.map((repository) => repository.toLowerCase()));
  const author = input.authorLogin.toLowerCase();

  return input.commits
    .filter((commit) => {
      if (!allowed.has(commit.repository.toLowerCase())) {
        return false;
      }
      if (commit.authorLogin && commit.authorLogin.toLowerCase() !== author) {
        return false;
      }
      return true;
    })
    .map(toAuthoredCommit);
}

async function searchRepoCommits(
  run: CommandRunner,
  repository: string,
  authorLogin: string,
  day: string
): Promise<RawAuthoredCommit[]> {
  const result = await run([
    "search",
    "commits",
    `--author=${authorLogin}`,
    `--committer-date=${day}`,
    `--repo=${repository}`,
    "--limit",
    "30",
    "--json",
    "sha,commit,author,repository"
  ]);

  if (result.exitCode !== 0 || result.stdout.trim().length === 0) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return [];
  }

  const commits = ghCommitListSchema.safeParse(parsed);
  if (!commits.success) {
    return [];
  }

  return commits.data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    repository: commit.repository?.nameWithOwner ?? repository,
    authorLogin: commit.author?.login ?? authorLogin
  }));
}

export async function buildGitActivityForDay(
  day: string,
  run: CommandRunner = defaultRunner
): Promise<AuthoredCommit[]> {
  try {
    const [login, repositories] = await Promise.all([
      getGithubLogin(),
      listMonitoredRepositoriesForApp()
    ]);

    if (!login || repositories.length === 0) {
      return [];
    }

    const names = repositories.map((repository) => repository.repository);
    const batches = await Promise.all(
      names.map((repository) => searchRepoCommits(run, repository, login, day))
    );

    return selectAuthoredCommits({
      commits: batches.flat(),
      authorLogin: login,
      monitoredRepositories: names
    });
  } catch {
    return [];
  }
}
