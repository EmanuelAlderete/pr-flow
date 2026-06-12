import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MonitoredPr } from "@/modules/prs/lib/domain";
import {
  enrichMonitoredPrsWithSlackShares,
  enrichPrApiResponse
} from "@/modules/prs/lib/pr-slack-share-enrichment";

vi.mock("@/modules/prs/lib/pr-slack-share-repository", () => ({
  getPrSlackSharesByUrls: vi.fn()
}));

import { getPrSlackSharesByUrls } from "@/modules/prs/lib/pr-slack-share-repository";

const samplePr: MonitoredPr = {
  id: "PR_1",
  number: 7,
  title: "JOR-1 fix",
  url: "https://github.com/acme/a/pull/7",
  repository: "acme/a",
  createdAt: "2026-05-28T10:00:00Z",
  avaliou: [],
  naoAvaliou: [],
  semReviewersSolicitados: false,
  aprovou: [],
  solicitouAlteracoes: [],
  pendente: [],
  requestedReviewersCount: 0,
  statusGeral: "pending_review"
};

describe("enrichMonitoredPrsWithSlackShares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anexa slackShare quando houver registro", async () => {
    vi.mocked(getPrSlackSharesByUrls).mockResolvedValue(
      new Map([
        [
          samplePr.url,
          {
            sharedAt: "2026-05-28T11:00:00.000Z",
            channel: "squad-jornada-pr"
          }
        ]
      ])
    );

    const [enriched] = await enrichMonitoredPrsWithSlackShares([samplePr]);

    expect(enriched.slackShare).toEqual({
      sharedAt: "2026-05-28T11:00:00.000Z",
      channel: "squad-jornada-pr"
    });
  });

  it("mantém PR sem slackShare quando não houver registro", async () => {
    vi.mocked(getPrSlackSharesByUrls).mockResolvedValue(new Map());

    const [enriched] = await enrichMonitoredPrsWithSlackShares([samplePr]);

    expect(enriched).toEqual(samplePr);
  });
});

describe("enrichPrApiResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignora respostas que não são ok", async () => {
    const response = { status: "error" as const, message: "falha" };
    const getShares = vi.mocked(getPrSlackSharesByUrls);
    getShares.mockClear();

    await expect(enrichPrApiResponse(response)).resolves.toEqual(response);
    expect(getShares).not.toHaveBeenCalled();
  });
});
