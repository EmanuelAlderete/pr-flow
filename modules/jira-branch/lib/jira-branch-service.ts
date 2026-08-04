import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import {
  createRemoteBranch,
  getRemoteBranchSha,
  remoteBranchExists
} from "@/modules/jira-branch/lib/gh-branch-client";
import { loadJiraBranchNamingContext } from "@/modules/jira-branch/lib/jira-branch-context";
import { suggestJiraBranchSlug } from "@/modules/jira-branch/lib/jira-branch-name-service";
import {
  buildTicketBranchName,
  resolveBranchPrefixFromIssueType
} from "@/modules/jira-branch/lib/jira-branch-prefix";
import type {
  JiraBranchCheckInput,
  JiraBranchCreateInput
} from "@/modules/jira-branch/lib/jira-branch-validation";
import { GhCommandError, GhUnauthenticatedError, type CommandRunner } from "@/modules/prs/lib/gh-client";
import { getMonitoredRepositoryBySlug } from "@/modules/prs/lib/monitored-repository-repository";
import { ensureMonitoredRepositoriesReady } from "@/modules/prs/lib/monitored-repositories-service";

const JIRA_BRANCH_CREATE_LOG_SOURCE = "jira-branch:create";
const JIRA_BRANCH_CHECK_LOG_SOURCE = "jira-branch:check";

export type JiraBranchRepositoryCheck = {
  repository: string;
  exists: boolean;
};

export type JiraBranchCheckResult =
  | { status: "ok"; prefix: "feat" | "fix"; branchName: string; checks: JiraBranchRepositoryCheck[] }
  | { status: "not_found"; message: string }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

export type JiraBranchCreateItemResult = {
  repository: string;
  status: "created" | "skipped" | "error";
  branchName: string;
  message?: string;
  openPrUrl?: string;
};

export type JiraBranchCreateResult =
  | { status: "ok"; prefix: "feat" | "fix"; branchName: string; results: JiraBranchCreateItemResult[] }
  | { status: "not_found"; message: string }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

async function resolveBranchNaming(
  issueKey: string,
  slug: string
): Promise<{ prefix: "feat" | "fix"; branchName: string } | null> {
  const context = await loadJiraBranchNamingContext(issueKey);
  if (!context) {
    return null;
  }

  const prefix = resolveBranchPrefixFromIssueType(context.issueTypeName);
  return {
    prefix,
    branchName: buildTicketBranchName(prefix, context.issueKey, slug)
  };
}

function buildOpenPrWizardUrl(repository: string, branchName: string): string {
  const params = new URLSearchParams({
    repository,
    branch: branchName
  });
  return `/prs/open?${params.toString()}`;
}

export async function checkJiraBranches(
  issueKey: string,
  input: JiraBranchCheckInput,
  run?: CommandRunner
): Promise<JiraBranchCheckResult> {
  const naming = await resolveBranchNaming(issueKey, input.slug);
  if (!naming) {
    return {
      status: "not_found",
      message: "Ticket ainda não está no cache. Aguarde a próxima sincronização do Jira."
    };
  }

  try {
    const checks: JiraBranchRepositoryCheck[] = [];

    for (const repository of input.repositories) {
      const exists = await remoteBranchExists(repository, naming.branchName, run);
      checks.push({ repository, exists });
    }

    writeSystemLogFireAndForget({
      level: "info",
      source: JIRA_BRANCH_CHECK_LOG_SOURCE,
      message: "Verificação de branch existente.",
      details: { issueKey, branchName: naming.branchName, checks }
    });

    return {
      status: "ok",
      prefix: naming.prefix,
      branchName: naming.branchName,
      checks
    };
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return { status: "unauthenticated", message: error.message };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Falha ao verificar branches no GitHub." };
  }
}

export async function createJiraBranches(
  issueKey: string,
  input: JiraBranchCreateInput,
  run?: CommandRunner
): Promise<JiraBranchCreateResult> {
  await ensureMonitoredRepositoriesReady();

  const naming = await resolveBranchNaming(issueKey, input.slug);
  if (!naming) {
    return {
      status: "not_found",
      message: "Ticket ainda não está no cache. Aguarde a próxima sincronização do Jira."
    };
  }

  const results: JiraBranchCreateItemResult[] = [];

  try {
    for (const target of input.targets) {
      const monitored = await getMonitoredRepositoryBySlug(target.repository);
      if (!monitored) {
        results.push({
          repository: target.repository,
          status: "error",
          branchName: naming.branchName,
          message: "Repositório não cadastrado para monitoramento."
        });
        continue;
      }

      if (await remoteBranchExists(target.repository, naming.branchName, run)) {
        results.push({
          repository: target.repository,
          status: "skipped",
          branchName: naming.branchName,
          message: "Branch já existe neste repositório.",
          openPrUrl: buildOpenPrWizardUrl(target.repository, naming.branchName)
        });
        continue;
      }

      const baseSha = await getRemoteBranchSha(target.repository, target.baseBranch, run);
      if (!baseSha) {
        results.push({
          repository: target.repository,
          status: "error",
          branchName: naming.branchName,
          message: `Branch base "${target.baseBranch}" não encontrada.`
        });
        continue;
      }

      await createRemoteBranch(target.repository, naming.branchName, baseSha, run);

      results.push({
        repository: target.repository,
        status: "created",
        branchName: naming.branchName,
        openPrUrl: buildOpenPrWizardUrl(target.repository, naming.branchName)
      });
    }

    const createdCount = results.filter((item) => item.status === "created").length;
    writeSystemLogFireAndForget({
      level: createdCount > 0 ? "info" : "warn",
      source: JIRA_BRANCH_CREATE_LOG_SOURCE,
      message:
        createdCount > 0
          ? `Branch criada em ${createdCount} repositório(s).`
          : "Nenhuma branch criada.",
      details: {
        issueKey,
        branchName: naming.branchName,
        results
      }
    });

    return {
      status: "ok",
      prefix: naming.prefix,
      branchName: naming.branchName,
      results
    };
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return { status: "unauthenticated", message: error.message };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }

    writeSystemLogFireAndForget({
      level: "error",
      source: JIRA_BRANCH_CREATE_LOG_SOURCE,
      message: "Erro inesperado ao criar branches.",
      details: sanitizeErrorForLog(error)
    });

    return { status: "error", message: "Falha ao criar branches no GitHub." };
  }
}

export { suggestJiraBranchSlug };
