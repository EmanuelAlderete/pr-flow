import { describe, expect, it } from "vitest";
import { buildReviewerQueue } from "@/modules/prs/lib/reviewer-queue-service";
import type { MonitoredPrRaw } from "@/modules/prs/lib/domain";

describe("buildReviewerQueue", () => {
  it("ordena pendente, desatualizada e ja avaliada", () => {
    const raw: MonitoredPrRaw[] = [
      {
        id: "1",
        number: 1,
        title: "Z revisada",
        url: "https://github.com/acme/a/pull/1",
        repository: "acme/a",
        createdAt: "2026-05-20T08:00:00Z",
        authorLogin: "autor",
        requestedReviewers: [],
        reviews: [{ login: "rigon", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }]
      },
      {
        id: "2",
        number: 2,
        title: "A pendente",
        url: "https://github.com/acme/a/pull/2",
        repository: "acme/a",
        createdAt: "2026-05-20T08:00:00Z",
        authorLogin: "autor",
        requestedReviewers: ["rigon"],
        reviews: []
      },
      {
        id: "3",
        number: 3,
        title: "M desatualizada",
        url: "https://github.com/acme/a/pull/3",
        repository: "acme/a",
        createdAt: "2026-05-20T08:00:00Z",
        authorLogin: "autor",
        requestedReviewers: ["rigon"],
        reviews: [{ login: "rigon", state: "DISMISSED", submittedAt: "2026-05-28T12:00:00Z" }]
      }
    ];

    const queue = buildReviewerQueue(raw, "rigon");
    expect(queue.map((item) => item.title)).toEqual(["A pendente", "M desatualizada", "Z revisada"]);
    expect(queue.map((item) => item.myReviewStatus)).toEqual(["pending", "dismissed", "reviewed"]);
  });
});
