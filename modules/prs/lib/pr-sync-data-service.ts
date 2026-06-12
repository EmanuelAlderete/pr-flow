import { saveGithubLogin } from "@/modules/app/lib/github-login-repository";
import type {
  MonitoredPr,
  PrApiResponse,
  PrReviewContextRecord,
  ReviewerQueueApiResponse,
  ReviewerQueuePr
} from "@/modules/prs/lib/domain";
import { collectOpenPrsFromRepos, GhCommandError, GhUnauthenticatedError } from "@/modules/prs/lib/gh-client";
import { aggregateReviewerStatus } from "@/modules/prs/lib/reviewer-aggregation";
import { buildReviewerQueue } from "@/modules/prs/lib/reviewer-queue-service";
import {
  getMonitoredRepositorySlugsForSync,
  noMonitoredRepositoriesMessage
} from "@/modules/prs/lib/monitored-repositories-service";

export type PrSyncDataSuccess = {
  status: "ok";
  monitor: MonitoredPr[];
  reviewerQueue: ReviewerQueuePr[];
  reviewContext: PrReviewContextRecord[];
  fetchedAt: string;
  githubLogin: string;
};

export type PrSyncDataFailure = {
  status: "unauthenticated" | "error";
  message: string;
};

export type PrSyncDataResult = PrSyncDataSuccess | PrSyncDataFailure;

export type GetPrSyncDataOptions = {
  repositories?: string[];
};

export async function getPrSyncData(
  collector: typeof collectOpenPrsFromRepos = collectOpenPrsFromRepos,
  options?: GetPrSyncDataOptions
): Promise<PrSyncDataResult> {
  const repos = options?.repositories ?? (await getMonitoredRepositorySlugsForSync());
  if (repos.length === 0) {
    return {
      status: "error",
      message: noMonitoredRepositoriesMessage()
    };
  }

  try {
    const { prs: raw, githubLogin } = await collector(repos);
    const monitor = raw
      .filter((pr) => pr.authorLogin === githubLogin)
      .map(aggregateReviewerStatus)
      .sort((a, b) => Number(Boolean(b.readyToMerge)) - Number(Boolean(a.readyToMerge)));
    const reviewerQueue = buildReviewerQueue(raw, githubLogin);
    const reviewContext: PrReviewContextRecord[] = raw.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      repository: pr.repository,
      authorLogin: pr.authorLogin ?? "",
      reviews: pr.reviews
    }));
    const fetchedAt = new Date().toISOString();

    try {
      await saveGithubLogin(githubLogin);
    } catch {
      // Sync segue sem persistir settings.
    }

    return { status: "ok", monitor, reviewerQueue, reviewContext, fetchedAt, githubLogin };
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
    return { status: "error", message: "Falha inesperada ao sincronizar PRs." };
  }
}

export function toMonitorApiResponse(result: PrSyncDataSuccess): PrApiResponse {
  return {
    status: "ok",
    data: result.monitor,
    fetchedAt: result.fetchedAt,
    githubLogin: result.githubLogin
  };
}

export function toReviewerQueueApiResponse(result: PrSyncDataSuccess): ReviewerQueueApiResponse {
  return {
    status: "ok",
    data: result.reviewerQueue,
    fetchedAt: result.fetchedAt,
    githubLogin: result.githubLogin
  };
}
