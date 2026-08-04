import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import type { CommandRunner } from "@/modules/prs/lib/gh-client";
import { isBranchFullyMergedInto } from "@/modules/prs/lib/open-pr/gh-open-pr-client";
import { redirectMergedOpenPrBranchBases } from "@/modules/prs/lib/open-pr/open-pr-branch-base-redirect";
import {
  listOpenPrBranchBasesForRepository,
  updateOpenPrBranchBaseTargets
} from "@/modules/prs/lib/open-pr/open-pr-branch-base-repository";
import { listMonitoredRepositoriesForApp } from "@/modules/prs/lib/monitored-repositories-service";

const OPEN_PR_BRANCH_BASE_SYNC_LOG_SOURCE = "open-pr:branch-base-sync";

export type OpenPrBranchBaseSyncResult = {
  status: "ok" | "skipped";
  repositoriesChecked: number;
  updatedCount: number;
};

export async function syncOpenPrBranchBaseRedirects(
  run?: CommandRunner
): Promise<OpenPrBranchBaseSyncResult> {
  const repositories = await listMonitoredRepositoriesForApp();
  if (repositories.length === 0) {
    return { status: "skipped", repositoriesChecked: 0, updatedCount: 0 };
  }

  let updatedCount = 0;

  for (const repository of repositories) {
    const records = await listOpenPrBranchBasesForRepository(repository.repository);
    if (records.length === 0) {
      continue;
    }

    const workingRecords = records.map((record) => ({
      branchName: record.branchName,
      baseBranch: record.baseBranch
    }));

    const result = await redirectMergedOpenPrBranchBases({
      repository: repository.repository,
      defaultBranch: repository.defaultBranch,
      records: workingRecords,
      isBranchFullyMergedInto: (repo, branch, intoBranch) =>
        isBranchFullyMergedInto(repo, branch, intoBranch, run),
      updateTargets: (fromBaseBranch, toBaseBranch) =>
        updateOpenPrBranchBaseTargets(repository.repository, fromBaseBranch, toBaseBranch)
    });

    if (result.updatedCount > 0) {
      updatedCount += result.updatedCount;
      writeSystemLogFireAndForget({
        level: "info",
        source: OPEN_PR_BRANCH_BASE_SYNC_LOG_SOURCE,
        message: "Branches destino redirecionadas após merge.",
        details: {
          repository: repository.repository,
          defaultBranch: repository.defaultBranch,
          updatedCount: result.updatedCount,
          redirects: result.redirects
        }
      });
    }
  }

  return {
    status: "ok",
    repositoriesChecked: repositories.length,
    updatedCount
  };
}
