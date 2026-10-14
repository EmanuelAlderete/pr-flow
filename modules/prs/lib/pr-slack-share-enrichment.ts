import type { MonitoredPr, PrApiResponse } from "@/modules/prs/lib/domain";
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

export async function enrichMonitoredPrsWithLocalReviews(prs: MonitoredPr[]): Promise<MonitoredPr[]> {
  if (prs.length === 0) {
    return prs;
  }

  const reviews = await getLatestLocalReviewsByPullRequest();
  return prs.map((pr) => {
    const localReview = reviews.get(`${pr.repository}#${pr.number}`) ?? null;
    if (!localReview) {
      return pr;
    }
    return { ...pr, localReview };
  });
}
