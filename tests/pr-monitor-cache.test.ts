import { afterEach, describe, expect, it } from "vitest";
import {
  clearPrMonitorLastSync,
  loadPrMonitorLastSync,
  savePrMonitorLastSync
} from "@/modules/prs/lib/pr-monitor-cache";
import type { PrApiSuccess } from "@/modules/prs/lib/domain";

const sampleOk: PrApiSuccess = {
  status: "ok",
  fetchedAt: "2026-05-28T12:00:00Z",
  githubLogin: "rigon",
  data: [
    {
      id: "PR_1",
      number: 1,
      title: "feat",
      url: "https://github.com/acme/a/pull/1",
      repository: "acme/a",
      createdAt: "2026-05-28T10:00:00Z",
      avaliou: [],
      naoAvaliou: ["ana"],
      semReviewersSolicitados: false,
      aprovou: [],
      solicitouAlteracoes: [],
      pendente: ["ana"],
      statusGeral: "pending_review"
    }
  ]
};

describe("pr-monitor-cache", () => {
  afterEach(() => {
    clearPrMonitorLastSync();
  });

  it("salva e carrega ultima sincronizacao ok", () => {
    savePrMonitorLastSync(sampleOk);
    expect(loadPrMonitorLastSync()).toEqual(sampleOk);
  });

  it("ignora payloads invalidos no storage", () => {
    localStorage.setItem("pr-flow:last-sync", JSON.stringify({ status: "ok", data: "x" }));
    expect(loadPrMonitorLastSync()).toBeNull();
  });

  it("nao persiste respostas de erro ou nao autenticadas", () => {
    savePrMonitorLastSync({ status: "error", message: "falhou" });
    savePrMonitorLastSync({ status: "unauthenticated", message: "gh auth login" });
    expect(loadPrMonitorLastSync()).toBeNull();
  });
});
