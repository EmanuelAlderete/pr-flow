import { GhCommandError, GhUnauthenticatedError, type CommandRunner } from "@/modules/prs/lib/gh-client";
import { getGhAuthenticatedLogin, listAuthorBranches } from "@/modules/prs/lib/open-pr/gh-open-pr-client";
import {
  getCachedOpenPrBranches,
  setCachedOpenPrBranches
} from "@/modules/prs/lib/open-pr/open-pr-branch-cache";
import { enrichOpenPrBranchItems } from "@/modules/prs/lib/open-pr/open-pr-branch-enrichment";
import type { OpenPrBranchItem, OpenPrBranchesResult } from "@/modules/prs/lib/open-pr/open-pr-types";

async function listAuthorBranchesWithEnrichment(
  repository: string,
  run: CommandRunner | undefined,
  githubLogin: string
): Promise<OpenPrBranchItem[]> {
  const authorBranches = await listAuthorBranches(repository, githubLogin, run);
  return enrichOpenPrBranchItems(
    authorBranches.map((branch) => ({
      branchName: branch.name
    }))
  );
}

export async function discoverOpenPrBranches(
  repository: string,
  run?: CommandRunner
): Promise<OpenPrBranchesResult> {
  const cached = getCachedOpenPrBranches(repository);
  if (cached) {
    return cached;
  }

  try {
    const githubLogin = await getGhAuthenticatedLogin(run);
    const branches = await listAuthorBranchesWithEnrichment(repository, run, githubLogin);
    const result = {
      status: "ok" as const,
      branches,
      githubLogin,
      branchSource: "github" as const
    };
    setCachedOpenPrBranches(repository, result);
    return result;
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return { status: "unauthenticated", message: error.message };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Falha ao listar branches." };
  }
}
