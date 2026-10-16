import type { MonitoredPr, PrApiResponse, PrLocalReviewInfo } from "@/modules/prs/lib/domain";
import { getLatestLocalReviewsByPullRequest } from "@/modules/prs/lib/local-review/local-review-repository";
import { getPrSlackSharesByUrls } from "@/modules/prs/lib/pr-slack-share-repository";

export async function enrichPrApiResponse(response: PrApiResponse): Promise<PrApiResponse> {
  if (response.status !== "ok" && response.status !== "stale") {
    return response;
  }

  const withSlack = await enrichMonitoredPrsWithSlackShares(response.data);
  return {
    ...response,
    data: await enrichMonitoredPrsWithLocalReviews(withSlack)
  };
}

export async function enrichMonitoredPrsWithSlackShares(prs: MonitoredPr[]): Promise<MonitoredPr[]> {
  if (prs.length === 0) {
    return prs;
  }

  const sharesByUrl = await getPrSlackSharesByUrls(prs.map((pr) => pr.url));

  return prs.map((pr) => {
    const slackShare = sharesByUrl.get(pr.url) ?? null;
    if (!slackShare) {
      return pr;
    }

    return { ...pr, slackShare };
  });
}

export async function attachLocalReviews<T extends { repository: string; number: number }>(
  items: T[]
): Promise<Array<T & { localReview?: PrLocalReviewInfo | null }>> {
  if (items.length === 0) {
    return items;
  }

  const reviews = await getLatestLocalReviewsByPullRequest();
  return items.map((item) => {
    const localReview = reviews.get(`${item.repository}#${item.number}`) ?? null;
    if (!localReview) {
      return item;
    }
    return { ...item, localReview };
  });
}

export async function enrichMonitoredPrsWithLocalReviews(prs: MonitoredPr[]): Promise<MonitoredPr[]> {
  return attachLocalReviews(prs);
}
