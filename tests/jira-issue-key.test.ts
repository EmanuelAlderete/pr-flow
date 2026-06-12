import { describe, expect, it } from "vitest";
import {
  extractJiraIssueKey,
  getJiraAppIssueHref,
  getJiraBrowseUrl,
  linkifyJiraIssueKeysInMarkdown,
  normalizeJiraIssueKey,
  resolvePrTitleHref
} from "@/modules/jira-issue-key";

describe("jira-issue-key", () => {
  it("extrai chave JOR no titulo e normaliza para maiusculas", () => {
    expect(extractJiraIssueKey("JOR-1234 Ajuste no fluxo")).toBe("JOR-1234");
    expect(extractJiraIssueKey("jor-99 fix")).toBe("JOR-99");
  });

  it("extrai chave JOR em qualquer posicao do titulo", () => {
    expect(extractJiraIssueKey("feat(JOR-88): ajuste")).toBe("JOR-88");
    expect(extractJiraIssueKey("[JOR-1] titulo")).toBe("JOR-1");
    expect(extractJiraIssueKey("feat JOR-1 no meio")).toBe("JOR-1");
  });

  it("retorna null quando titulo nao contem JOR-xxx", () => {
    expect(extractJiraIssueKey("fix: sem ticket")).toBeNull();
  });

  it("normaliza entrada bruta ou titulo com chave embutida", () => {
    expect(normalizeJiraIssueKey("jor-42")).toBe("JOR-42");
    expect(normalizeJiraIssueKey("JOR-7 titulo")).toBe("JOR-7");
  });

  it("monta url de browse no Jira para a chave", () => {
    expect(getJiraBrowseUrl("JOR-1234")).toBe("https://jusfy.atlassian.net/browse/JOR-1234");
  });

  it("usa Jira no titulo quando houver chave e fallback caso contrario", () => {
    expect(resolvePrTitleHref("JOR-42 Titulo", "https://github.com/a/b/pull/1")).toBe(
      "https://jusfy.atlassian.net/browse/JOR-42"
    );
    expect(resolvePrTitleHref("Sem ticket", "https://github.com/a/b/pull/1")).toBe("https://github.com/a/b/pull/1");
  });

  it("monta href interno do app para a pagina de tickets", () => {
    expect(getJiraAppIssueHref("jor-42")).toBe("/jira?issue=JOR-42");
  });

  it("linkifica chaves JOR no markdown para a rota interna", () => {
    expect(linkifyJiraIssueKeysInMarkdown("Trabalhei em jor-99 hoje.")).toBe(
      "Trabalhei em [JOR-99](/jira?issue=JOR-99) hoje."
    );
    expect(linkifyJiraIssueKeysInMarkdown("Ver [JOR-1](/jira?issue=JOR-1) e JOR-2.")).toBe(
      "Ver [JOR-1](/jira?issue=JOR-1) e [JOR-2](/jira?issue=JOR-2)."
    );
    expect(linkifyJiraIssueKeysInMarkdown("Código `jor-5` intacto.")).toBe("Código `jor-5` intacto.");
    expect(linkifyJiraIssueKeysInMarkdown("```\njor-7\n```")).toBe("```\njor-7\n```");
  });
});

describe("collectJiraIssueKeysFromTexts", () => {
  it("deduplica chaves extraidas de varios textos", async () => {
    const { collectJiraIssueKeysFromTexts } = await import("@/modules/jira-issue-key");

    expect(collectJiraIssueKeysFromTexts(["JOR-1: a", "feat jor-2", "JOR-1 de novo", "sem ticket"])).toEqual([
      "JOR-1",
      "JOR-2"
    ]);
  });
});

describe("createPrMonitorCacheIssueKeySource", () => {
  it("coleta chaves dos titulos do cache de PR sem depender do modulo prs no teste", async () => {
    const { createPrMonitorCacheIssueKeySource } = await import("@/modules/jira-issue-key/server");

    const source = createPrMonitorCacheIssueKeySource({
      loadPrMonitorCache: async () => ({
        data: [{ title: "JOR-9: fix" }, { title: "Sem ticket" }, { title: "jor-10 patch" }] as never[],
        fetchedAt: new Date().toISOString(),
        githubLogin: "dev"
      })
    });

    await expect(source.collectIssueKeys()).resolves.toEqual(["JOR-9", "JOR-10"]);
  });

  it("retorna lista vazia quando cache ausente ou leitura falha", async () => {
    const { createPrMonitorCacheIssueKeySource } = await import("@/modules/jira-issue-key/server");

    const missing = createPrMonitorCacheIssueKeySource({
      loadPrMonitorCache: async () => null
    });
    const failing = createPrMonitorCacheIssueKeySource({
      loadPrMonitorCache: async () => {
        throw new Error("db down");
      }
    });

    await expect(missing.collectIssueKeys()).resolves.toEqual([]);
    await expect(failing.collectIssueKeys()).resolves.toEqual([]);
  });
});
