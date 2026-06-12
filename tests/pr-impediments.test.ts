import { describe, expect, it } from "vitest";
import { getPrImpediments, mustShowImpedimentIcons } from "@/modules/prs/lib/core/pr-impediments";

describe("pr impediments", () => {
  it("exige icone quando status for pending_review", () => {
    expect(mustShowImpedimentIcons("pending_review")).toBe(true);
    expect(mustShowImpedimentIcons("approved")).toBe(false);
  });

  it("inclui icone de revisoes pendentes quando nao ha maioria", () => {
    const impediments = getPrImpediments({
      statusGeral: "pending_review",
      pendingReviewersCount: 2,
      requestedReviewersCount: 3,
      requestedChangesCount: 0,
      hasConflicts: false,
      hasUnresolvedComments: false
    });

    expect(impediments.length).toBeGreaterThanOrEqual(1);
    expect(impediments.some((item) => item.key === "pending-reviews")).toBe(true);
  });

  it("garante ao menos um icone em pending_review mesmo sem bloqueios explicitos", () => {
    const impediments = getPrImpediments({
      statusGeral: "pending_review",
      pendingReviewersCount: 2,
      requestedReviewersCount: 7,
      requestedChangesCount: 0,
      hasConflicts: false,
      hasUnresolvedComments: false
    });

    expect(impediments.length).toBeGreaterThanOrEqual(1);
  });

  it("inclui icone de aprovacoes suficientes quando houver maioria aprovada com conflito", () => {
    const impediments = getPrImpediments({
      statusGeral: "approved",
      pendingReviewersCount: 0,
      requestedReviewersCount: 3,
      requestedChangesCount: 0,
      hasConflicts: true,
      hasUnresolvedComments: false
    });

    expect(impediments.map((item) => item.key)).toEqual(
      expect.arrayContaining(["sufficient-approvals", "conflicts"])
    );
    expect(impediments.find((item) => item.key === "sufficient-approvals")).toMatchObject({
      tone: "danger",
      label: "Já possui aprovações suficientes"
    });
  });

  it("mantem icones de conflito e comentarios quando existirem", () => {
    const impediments = getPrImpediments({
      statusGeral: "pending_review",
      pendingReviewersCount: 2,
      requestedReviewersCount: 3,
      requestedChangesCount: 0,
      hasConflicts: true,
      hasUnresolvedComments: true
    });

    expect(impediments.map((item) => item.key)).toEqual(
      expect.arrayContaining(["conflicts", "unresolved-comments", "pending-reviews"])
    );
  });
});
