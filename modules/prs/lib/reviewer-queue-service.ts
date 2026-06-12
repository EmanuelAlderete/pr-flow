import { saveGithubLogin } from "@/modules/app/lib/github-login-repository";
import type { MonitoredPrRaw, ReviewerQueueApiResponse, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import {
  getMyReviewStatus,
  isReviewerPullRequest,
  myReviewStatusSortRank
} from "@/modules/prs/lib/core/my-review-status";
import { collectOpenPrsFromRepos, GhCommandError, GhUnauthenticatedError } from "@/modules/prs/lib/gh-client";
import {
  getMonitoredRepositorySlugsForSync,
  noMonitoredRepositoriesMessage
} from "@/modules/prs/lib/monitored-repositories-service";

export function mapReviewerQueuePr(pr: MonitoredPrRaw, githubLogin: string): ReviewerQueuePr {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repository: pr.repository,
    myReviewStatus: getMyReviewStatus(pr, githubLogin)
  };
}

export function buildReviewerQueue(raw: MonitoredPrRaw[], githubLogin: string): ReviewerQueuePr[] {
  return raw
    .filter((pr) => isReviewerPullRequest(pr, githubLogin))
    .map((pr) => mapReviewerQueuePr(pr, githubLogin))
    .sort((left, right) => {
      const rank =
        myReviewStatusSortRank(left.myReviewStatus) - myReviewStatusSortRank(right.myReviewStatus);
      if (rank !== 0) {
        return rank;
      }
      return left.title.localeCompare(right.title, "pt-BR");
    });
}

export type GetReviewerQueueDataOptions = {
  repositories?: string[];
};

export async function getReviewerQueueData(
  collector: typeof collectOpenPrsFromRepos = collectOpenPrsFromRepos,
  options?: GetReviewerQueueDataOptions
): Promise<ReviewerQueueApiResponse> {
  const repos = options?.repositories ?? (await getMonitoredRepositorySlugsForSync());
  if (repos.length === 0) {
    return {
      status: "error",
      message: noMonitoredRepositoriesMessage()
    };
  }

  try {
    const { prs: raw, githubLogin } = await collector(repos);
    const data = buildReviewerQueue(raw, githubLogin);

    try {
      await saveGithubLogin(githubLogin);
    } catch {
      // Fila de revisão segue funcionando sem persistir settings.
    }

    return { status: "ok", data, fetchedAt: new Date().toISOString(), githubLogin };
  } catch (error) {
    if (error instanceof GhUnauthenticatedError) {
      return {
        status: "unauthenticated",
        message: "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
      };
    }
    if (error instanceof GhCommandError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Falha inesperada ao atualizar fila de revisão." };
  }
}
