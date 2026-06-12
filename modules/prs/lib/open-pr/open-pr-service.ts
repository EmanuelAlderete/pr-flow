import { runPrSyncCron } from "@/modules/devtools/lib/cron-job-runners";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { GhCommandError, GhUnauthenticatedError } from "@/modules/prs/lib/gh-client";
import { clearOpenPrBranchCache } from "@/modules/prs/lib/open-pr/open-pr-branch-cache";
import { discoverOpenPrBranches } from "@/modules/prs/lib/open-pr/open-pr-branch-discovery";
import { createPullRequest, getGhAuthenticatedLogin } from "@/modules/prs/lib/open-pr/gh-open-pr-client";
import { ensureOpenPrBodyJiraHeadingLink } from "@/modules/prs/lib/open-pr/open-pr-body-jira-heading";
import { generateOpenPrBody } from "@/modules/prs/lib/open-pr/open-pr-body-service";
import type {
  OpenPrCreateInput,
  OpenPrGenerateBodyInput
} from "@/modules/prs/lib/open-pr/open-pr-validation";
import {
  ensureMonitoredRepositoriesReady,
  listMonitoredRepositoriesForApp,
  noMonitoredRepositoriesMessage
} from "@/modules/prs/lib/monitored-repositories-service";
import { getMonitoredRepositoryBySlug } from "@/modules/prs/lib/monitored-repository-repository";
import type { CommandRunner } from "@/modules/prs/lib/gh-client";

const OPEN_PR_CREATE_LOG_SOURCE = "open-pr:create";

export type {
  OpenPrBranchItem,
  OpenPrBranchSource,
  OpenPrBranchesResult
} from "@/modules/prs/lib/open-pr/open-pr-types";

export type OpenPrRepositoryItem = {
  repository: string;
  defaultBranch: string;
};

export type OpenPrRepositoriesResult =
  | { status: "ok"; repositories: OpenPrRepositoryItem[] }
  | { status: "error"; message: string };

export type OpenPrCreateResult =
  | { status: "ok"; url: string; number: number }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

export async function listOpenPrRepositories(): Promise<OpenPrRepositoriesResult> {
  const rows = await listMonitoredRepositoriesForApp();
  const repositories = rows.map((row) => ({
    repository: row.repository,
    defaultBranch: row.defaultBranch
  }));

  if (repositories.length === 0) {
    return {
      status: "error",
      message: noMonitoredRepositoriesMessage()
    };
  }

  return { status: "ok", repositories };
}

export async function listOpenPrBranches(
  repository: string,
  run?: CommandRunner
) {
  return discoverOpenPrBranches(repository, run);
}

export async function generateOpenPrBodyForBranch(
  input: OpenPrGenerateBodyInput & { title: string },
  run?: CommandRunner
) {
  return generateOpenPrBody(input, run);
}

export async function createOpenPullRequest(
  input: OpenPrCreateInput,
  run?: CommandRunner
): Promise<OpenPrCreateResult> {
  await ensureMonitoredRepositoriesReady();
  const monitored = await getMonitoredRepositoryBySlug(input.repository);
  if (!monitored) {
    return {
      status: "error",
      message: "Repositório não cadastrado para monitoramento."
    };
  }

  const baseBranch = input.baseBranch || monitored.defaultBranch;

  try {
    await getGhAuthenticatedLogin(run);
    const created = await createPullRequest(
      {
        repository: input.repository,
        branch: input.branch,
        baseBranch,
        title: input.title,
        body: ensureOpenPrBodyJiraHeadingLink(input.body, input.title),
        reviewers: input.reviewers
      },
      run
    );

    clearOpenPrBranchCache(input.repository);

    try {
      await runPrSyncCron({ manual: true });
    } catch (syncError) {
      writeSystemLogFireAndForget({
        level: "warn",
        source: OPEN_PR_CREATE_LOG_SOURCE,
        message: "PR criada, mas falha ao sincronizar cache de PRs.",
        details: {
          repository: input.repository,
          branch: input.branch,
          error: sanitizeErrorForLog(syncError)
        }
      });
    }

    return { status: "ok", url: created.url, number: created.number };
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return { status: "unauthenticated", message: error.message };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Falha ao criar pull request." };
  }
}
