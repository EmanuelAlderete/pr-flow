import { describe, expect, it } from "vitest";
import { aggregateReviewerStatus } from "@/modules/prs/lib/reviewer-aggregation";
import type { MonitoredPrRaw } from "@/modules/prs/lib/domain";

const basePr: MonitoredPrRaw = {
  id: "pr_1",
  number: 42,
  title: "feat: improve monitor",
  url: "https://github.com/acme/demo/pull/42",
  repository: "acme/demo",
  createdAt: "2026-05-28T10:00:00Z",
  requestedReviewers: ["ana", "bruno", "carla"],
  reviews: []
};

describe("aggregateReviewerStatus", () => {
  it("classifica reviewers solicitados entre avaliou e nao avaliou", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      reviews: [{ login: "ana", state: "COMMENTED", submittedAt: "2026-05-28T11:00:00Z" }]
    });

    expect(result.avaliou).toEqual(["ana"]);
    expect(result.naoAvaliou).toEqual(["bruno", "carla"]);
  });

  it("considera o ultimo review por reviewer como estado final", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      requestedReviewers: ["ana"],
      reviews: [
        { login: "ana", state: "CHANGES_REQUESTED", submittedAt: "2026-05-28T09:00:00Z" },
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }
      ]
    });

    expect(result.avaliou).toEqual(["ana"]);
    expect(result.naoAvaliou).toEqual([]);
  });

  it("ignora review de usuario fora da lista de requested reviewers", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      requestedReviewers: ["ana"],
      reviews: [{ login: "zoe", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }]
    });

    expect(result.avaliou).toEqual(["zoe"]);
    expect(result.naoAvaliou).toEqual(["ana"]);
  });

  it("mantem pr sem requested reviewers com indicador claro", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      requestedReviewers: [],
      reviews: [{ login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }]
    });

    expect(result.semReviewersSolicitados).toBe(true);
    expect(result.avaliou).toEqual(["ana"]);
    expect(result.naoAvaliou).toEqual([]);
  });

  it("considera revisada quando a maioria dos solicitados ja avaliou", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      requestedReviewers: ["ana", "bruno", "carla"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" }
      ]
    });

    expect(result.pendente).toEqual(["carla"]);
    expect(result.statusGeral).toBe("approved");
  });

  it("considera pronta para merge quando maioria avaliou e nao ha conflito", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      hasConflicts: false,
      requestedReviewers: ["ana", "bruno", "carla"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" }
      ]
    });

    expect(result.statusGeral).toBe("approved");
    expect(result.readyToMerge).toBe(true);
  });

  it("nao considera pronta para merge quando ha comentarios nao resolvidos", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      hasUnresolvedComments: true,
      requestedReviewers: ["ana", "bruno", "carla", "diana", "eduardo", "flavia", "gustavo"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "APPROVED", submittedAt: "2026-05-28T10:01:00Z" },
        { login: "carla", state: "APPROVED", submittedAt: "2026-05-28T10:02:00Z" },
        { login: "diana", state: "APPROVED", submittedAt: "2026-05-28T10:03:00Z" },
        { login: "eduardo", state: "APPROVED", submittedAt: "2026-05-28T10:04:00Z" }
      ]
    });

    expect(result.readyToMerge).toBe(false);
    expect(result.pendente).toEqual(["flavia", "gustavo"]);
  });

  it("considera pronta para merge com maioria revisada sem impedimentos", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      hasConflicts: false,
      hasUnresolvedComments: false,
      requestedReviewers: ["ana", "bruno", "carla", "diana", "eduardo", "flavia", "gustavo"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" },
        { login: "carla", state: "APPROVED", submittedAt: "2026-05-28T10:02:00Z" },
        { login: "diana", state: "APPROVED", submittedAt: "2026-05-28T10:03:00Z" },
        { login: "eduardo", state: "COMMENTED", submittedAt: "2026-05-28T10:04:00Z" }
      ]
    });

    expect(result.readyToMerge).toBe(true);
    expect(result.statusGeral).toBe("approved");
    expect(result.pendente).toEqual(["flavia", "gustavo"]);
  });

  it("considera pronta quando reviewRequests traz so pendentes e maioria ja revisou", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      hasConflicts: false,
      hasUnresolvedComments: false,
      requestedReviewers: ["flavia", "gustavo"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "APPROVED", submittedAt: "2026-05-28T10:01:00Z" },
        { login: "carla", state: "APPROVED", submittedAt: "2026-05-28T10:02:00Z" },
        { login: "diana", state: "APPROVED", submittedAt: "2026-05-28T10:03:00Z" },
        { login: "eduardo", state: "APPROVED", submittedAt: "2026-05-28T10:04:00Z" }
      ]
    });

    expect(result.requestedReviewersCount).toBe(7);
    expect(result.pendente).toEqual(["flavia", "gustavo"]);
    expect(result.readyToMerge).toBe(true);
    expect(result.statusGeral).toBe("approved");
  });

  it("nao considera pronta para merge quando ha conflito mesmo com maioria revisada", () => {
    const result = aggregateReviewerStatus({
      ...basePr,
      hasConflicts: true,
      requestedReviewers: ["ana", "bruno", "carla"],
      reviews: [
        { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
        { login: "bruno", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" }
      ]
    });

    expect(result.readyToMerge).toBe(false);
    expect(result.statusGeral).toBe("approved");
  });
});
