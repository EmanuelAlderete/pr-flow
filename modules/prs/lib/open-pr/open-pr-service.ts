import { runPrSyncCron } from "@/modules/devtools/lib/cron-job-runners";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { GhCommandError, GhUnauthenticatedError } from "@/modules/prs/lib/gh-client";
import { clearOpenPrBranchCache } from "@/modules/prs/lib/open-pr/open-pr-branch-cache";
import { discoverOpenPrBranches } from "@/modules/prs/lib/open-pr/open-pr-branch-discovery";
import {
  getOpenPrBranchBase,
  getOpenPrBranchBaseMap,
  listDistinctOpenPrBaseBranchesForRepository,
  upsertOpenPrBranchBase
} from "@/modules/prs/lib/open-pr/open-pr-branch-base-repository";
import {
  createPullRequest,
  getGhAuthenticatedLogin,
  listAuthorBranches
} from "@/modules/prs/lib/open-pr/gh-open-pr-client";
import { ensureOpenPrBodyJiraHeadingLink } from "@/modules/prs/lib/open-pr/open-pr-body-jira-heading";
import { generateOpenPrBody } from "@/modules/prs/lib/open-pr/open-pr-body-service";
import type { OpenPrBranchItem } from "@/modules/prs/lib/open-pr/open-pr-types";
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

export type OpenPrBaseBranchesResult =
  | { status: "ok"; defaultBranch: string; baseBranches: string[] }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

export async function listOpenPrBaseBranches(
  repository: string,
  run?: CommandRunner
): Promise<OpenPrBaseBranchesResult> {
  await ensureMonitoredRepositoriesReady();
  const monitored = await getMonitoredRepositoryBySlug(repository);
  if (!monitored) {
    return {
      status: "error",
      message: "Repositório não cadastrado para monitoramento."
    };
  }

  try {
    const githubLogin = await getGhAuthenticatedLogin(run);
    const [authorBranches, storedBaseBranches] = await Promise.all([
      listAuthorBranches(repository, githubLogin, run),
      listDistinctOpenPrBaseBranchesForRepository(repository)
    ]);

    const baseBranches = [
      ...new Set([
        monitored.defaultBranch,
        ...authorBranches.map((branch) => branch.name),
        ...storedBaseBranches
      ])
    ].sort((a, b) => {
      if (a === monitored.defaultBranch) {
        return -1;
      }
      if (b === monitored.defaultBranch) {
        return 1;
      }
      return a.localeCompare(b);
    });

    return {
      status: "ok",
      defaultBranch: monitored.defaultBranch,
      baseBranches
    };
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return { status: "unauthenticated", message: error.message };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Falha ao listar branches destino." };
  }
}

export async function resolveOpenPrBaseBranch(
  repository: string,
  branchName: string,
  requestedBaseBranch?: string
): Promise<string | null> {
  const monitored = await getMonitoredRepositoryBySlug(repository);
  if (!monitored) {
    return null;
  }

  if (requestedBaseBranch?.trim()) {
    return requestedBaseBranch.trim();
  }

  const stored = await getOpenPrBranchBase(repository, branchName);
  return stored?.baseBranch ?? monitored.defaultBranch;
}

async function attachStoredBaseBranches(
  repository: string,
  branches: OpenPrBranchItem[]
): Promise<OpenPrBranchItem[]> {
  const monitored = await getMonitoredRepositoryBySlug(repository);
  const fallbackBase = monitored?.defaultBranch ?? null;
  if (branches.length === 0) {
    return branches;
  }

  const baseMap = await getOpenPrBranchBaseMap(
    repository,
    branches.map((branch) => branch.name)
  );

  return branches.map((branch) => ({
    ...branch,
    baseBranch: baseMap.get(branch.name) ?? fallbackBase
  }));
}

export async function listOpenPrBranches(
  repository: string,
  run?: CommandRunner
) {
  const result = await discoverOpenPrBranches(repository, run);
  if (result.status !== "ok") {
    return result;
  }

  return {
    ...result,
    branches: await attachStoredBaseBranches(repository, result.branches)
  };
}

export async function generateOpenPrBodyForBranch(
  input: OpenPrGenerateBodyInput & { title: string },
  run?: CommandRunner
) {
  await upsertOpenPrBranchBase({
    repository: input.repository,
    branchName: input.branch,
    baseBranch: input.baseBranch
  });

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
    await upsertOpenPrBranchBase({
      repository: input.repository,
      branchName: input.branch,
      baseBranch
    });

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
