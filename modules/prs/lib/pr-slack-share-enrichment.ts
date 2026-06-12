import type { MonitoredPr, PrApiResponse } from "@/modules/prs/lib/domain";
import { getPrSlackSharesByUrls } from "@/modules/prs/lib/pr-slack-share-repository";

export async function enrichPrApiResponse(response: PrApiResponse): Promise<PrApiResponse> {
  if (response.status !== "ok" && response.status !== "stale") {
    return response;
  }

  return {
    ...response,
    data: await enrichMonitoredPrsWithSlackShares(response.data)
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
