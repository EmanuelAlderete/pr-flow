import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkoutPullRequest } from "@/modules/prs/lib/local-review/local-review-checkout";
import { pickNextLocalReview, resolveTargetedReview } from "@/modules/prs/lib/local-review/local-review-candidates";
import { buildClaudeArgs, claudeChildEnv } from "@/modules/prs/lib/local-review/local-review-claude";
import { agentsWithModel, buildLocalReviewPrompt, loadLocalReviewAgents } from "@/modules/prs/lib/local-review/local-review-protocol";
import {
  extractLocalReviewUsage,
  isolateClaudeResult,
  presentLocalReviewUsage,
  type LocalReviewUsage
} from "@/modules/prs/lib/local-review/local-review-usage";
import { buildLocalReviewView } from "@/modules/prs/lib/local-review/local-review-markdown";
import { applyReviewPolicy, parseLocalReviewReport } from "@/modules/prs/lib/local-review/local-review-report";

const now = new Date("2026-05-28T12:00:00.000Z");

const openPrs = [
  {
    id: "1",
    number: 10,
    title: "mais antiga",
    url: "https://github.com/acme/a/pull/10",
    repository: "acme/a",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "2",
    number: 11,
    title: "mais nova",
    url: "https://github.com/acme/a/pull/11",
    repository: "acme/a",
    createdAt: "2026-05-20T00:00:00.000Z"
  }
];

const heads = [
  { repository: "acme/a", number: 10, headSha: "aaa1111", baseRef: "main" },
  { repository: "acme/a", number: 11, headSha: "bbb2222", baseRef: "main" }
];

const report = {
  summary: "Há um null esquecido.",
  docsLoaded: ["README.md"],
  findings: [
    {
      agent: "correctness",
      path: "src/retry.ts",
      line: 4,
      message: "retry ignora null",
      confidence: 0.91
    },
    {
      agent: "security",
      path: "src/retry.ts",
      message: "talvez um log",
      confidence: 0.4
    },
    {
      agent: "contracts",
      path: "src/api.ts",
      message: "assinatura inventada",
      confidence: 0.95
    }
  ],
  notCommented: ["src/ok.ts — sem mudança de comportamento"],
  cleanJustification: "O restante só renomeia variável local.",
  traceability: [{ item: "Sem spec no repositório", status: "unclear" as const }],
  metaReview: { dropped: ["assinatura inventada"], notes: "a função citada não existe" }
};

describe("pickNextLocalReview", () => {
  it("revisa primeiro a PR de colega ainda pendente", () => {
    const pick = pickNextLocalReview({
      openPrs: [
        { ...openPrs[0], priority: 1 },
        { ...openPrs[1], priority: 0 }
      ],
      heads,
      reviews: [],
      now
    });
    expect(pick).toMatchObject({ status: "ready", candidate: { number: 11 } });
  });

  it("escolhe a PR aberta mais antiga que ainda não foi revisada nesse SHA", () => {
    const pick = pickNextLocalReview({ openPrs, heads, reviews: [], now });
    expect(pick).toMatchObject({ status: "ready", candidate: { number: 10, headSha: "aaa1111" } });
  });

  it("ignora SHA já revisado e não começa outra enquanto uma está em andamento", () => {
    const reviewed = pickNextLocalReview({
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "ok",
          updatedAt: now
        }
      ],
      now
    });
    expect(reviewed).toMatchObject({ status: "ready", candidate: { number: 11 } });

    const busy = pickNextLocalReview({
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 11,
          headSha: "bbb2222",
          status: "running",
          updatedAt: now
        }
      ],
      now
    });
    expect(busy.status).toBe("busy");
  });

  it("não repete erro recente e libera erro antigo", () => {
    const recent = pickNextLocalReview({
      openPrs: [openPrs[0]],
      heads: [heads[0]],
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "error",
          updatedAt: now
        }
      ],
      now
    });
    expect(recent.status).toBe("empty");

    const old = pickNextLocalReview({
      openPrs: [openPrs[0]],
      heads: [heads[0]],
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "error",
          updatedAt: new Date("2026-05-27T00:00:00.000Z")
        }
      ],
      now,
      retryErrorAfterMs: 60 * 60 * 1000
    });
    expect(old.status).toBe("ready");
  });
});

describe("resolveTargetedReview", () => {
  it("deixa repetir uma PR que falhou, mesmo com o cooldown da cron", () => {
    const decision = resolveTargetedReview({
      repository: "acme/a",
      number: 10,
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "error",
          updatedAt: now
        }
      ],
      now
    });
    expect(decision).toMatchObject({ status: "ready", candidate: { number: 10, headSha: "aaa1111" } });
  });

  it("não começa outra enquanto uma revisão recente está em andamento", () => {
    const decision = resolveTargetedReview({
      repository: "acme/a",
      number: 11,
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "running",
          updatedAt: now
        }
      ],
      now
    });
    expect(decision).toMatchObject({ status: "busy", prNumber: 10 });
  });

  it("libera uma revisão interrompida e avisa se a mesma já está rodando", () => {
    const stale = resolveTargetedReview({
      repository: "acme/a",
      number: 10,
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "running",
          updatedAt: new Date("2026-05-28T11:00:00.000Z")
        }
      ],
      now
    });
    expect(stale.status).toBe("ready");

    const same = resolveTargetedReview({
      repository: "acme/a",
      number: 10,
      openPrs,
      heads,
      reviews: [
        {
          repository: "acme/a",
          prNumber: 10,
          headSha: "aaa1111",
          status: "running",
          updatedAt: now
        }
      ],
      now
    });
    expect(same.status).toBe("already");
  });
});

describe("local review report", () => {
  it("descarta achado incerto e achado derrubado pelo meta-review", () => {
    const applied = applyReviewPolicy(report);
    expect(applied.findings.map((finding) => finding.message)).toEqual(["retry ignora null"]);
  });

  it("lê o JSON de dentro do envelope do Claude Code", () => {
    const parsed = parseLocalReviewReport(JSON.stringify({ type: "result", result: JSON.stringify(report) }));
    expect(parsed.summary).toBe(report.summary);
  });

  it("separa a revisão por subagente e aponta o arquivo", () => {
    const view = buildLocalReviewView(report, { repository: "acme/a", headSha: "abc1234" });
    const correctness = view.agents.find((agent) => agent.id === "correctness");
    const security = view.agents.find((agent) => agent.id === "security");
    const delivery = view.agents.find((agent) => agent.id === "delivery");
    const secondPass = view.agents.find((agent) => agent.id === "second-pass");

    expect(view.summary).toBe(report.summary);
    expect(correctness?.findings[0]).toMatchObject({
      location: "src/retry.ts:4",
      href: "https://github.com/acme/a/blob/abc1234/src/retry.ts#L4",
      message: "retry ignora null"
    });
    expect(security?.title).toBe("Segurança");
    expect(security?.findings.map((finding) => finding.message)).toEqual(["talvez um log"]);
    expect(delivery?.checks?.[0]).toMatchObject({ status: "unclear", label: "Incerto" });
    expect(secondPass?.list).toEqual(report.notCommented);
    expect(view.agents.map((agent) => agent.id)).toEqual([
      "correctness",
      "security",
      "contracts",
      "tests",
      "delivery",
      "conventions",
      "second-pass",
      "meta-review"
    ]);
  });

  it("lê o JSON cercado mesmo com as aspas escapadas no envelope", () => {
    const fenced = `\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``;
    const stdout = JSON.stringify({ type: "result", result: fenced, session_id: "abc" });
    const parsed = parseLocalReviewReport(stdout);
    expect(parsed.summary).toBe(report.summary);
    expect(parsed.findings).toHaveLength(report.findings.length);
  });

  it("guarda tokens, pico da janela e custo do stream do Claude", () => {
    const fenced = `\`\`\`json\n${JSON.stringify(report)}\n\`\`\``;
    const assistant = {
      type: "assistant",
      message: {
        id: "msg-1",
        model: "claude-haiku-4-5",
        usage: { input_tokens: 10, cache_read_input_tokens: 70_000, cache_creation_input_tokens: 500 }
      }
    };
    const duplicate = { ...assistant };
    const larger = {
      type: "assistant",
      message: {
        id: "msg-2",
        model: "claude-haiku-4-5",
        usage: { input_tokens: 8, cache_read_input_tokens: 80_000, cache_creation_input_tokens: 200 }
      }
    };
    const result = {
      type: "result",
      result: fenced,
      total_cost_usd: 0.42,
      modelUsage: {
        "claude-haiku-4-5": {
          inputTokens: 18,
          outputTokens: 900,
          cacheReadInputTokens: 150_000,
          cacheCreationInputTokens: 700,
          thinkingTokens: 40,
          contextWindow: 200_000,
          costUSD: 0.42
        }
      }
    };
    const raw = [assistant, duplicate, larger, result].map((event) => JSON.stringify(event)).join("\n");
    const usage = extractLocalReviewUsage(raw);
    expect(usage).toMatchObject({
      totalCostUsd: 0.42,
      peakContextTokens: 80_208,
      peakModel: "claude-haiku-4-5",
      models: [
        {
          id: "claude-haiku-4-5",
          inputTokens: 18,
          outputTokens: 900,
          cacheReadInputTokens: 150_000,
          contextWindow: 200_000
        }
      ]
    });
    expect(parseLocalReviewReport(isolateClaudeResult(raw)).summary).toBe(report.summary);
  });

  it("não trata o total acumulado como pico da janela", () => {
    const raw = JSON.stringify({
      type: "result",
      result: JSON.stringify(report),
      total_cost_usd: 1,
      modelUsage: {
        "claude-sonnet-5": {
          inputTokens: 100,
          outputTokens: 50,
          cacheReadInputTokens: 3_000_000,
          cacheCreationInputTokens: 10,
          contextWindow: 200_000,
          costUSD: 1
        }
      }
    });
    expect(extractLocalReviewUsage(raw)?.peakContextTokens).toBeNull();
    expect(extractLocalReviewUsage(raw)?.models[0]?.contextWindow).toBe(200_000);
  });

  it("rotula o modelo escolhido como orquestrador e subagentes", () => {
    const shared = presentLocalReviewUsage(usageFixture("sonnet", ["claude-sonnet-5-5"]));
    expect(shared.chosenLabel).toBe("Sonnet");
    expect(shared.splitRoles).toBe(false);
    expect(shared.models.map((model) => model.role)).toEqual(["both"]);

    const split = presentLocalReviewUsage(
      usageFixture("sonnet", ["claude-haiku-5-5", "claude-sonnet-5-5"])
    );
    expect(split.splitRoles).toBe(true);
    expect(split.models.map((model) => [model.id, model.role])).toEqual([
      ["claude-sonnet-5-5", "orchestrator"],
      ["claude-haiku-5-5", "subagents"]
    ]);
  });
});

function usageFixture(requestedModel: string, ids: string[]): LocalReviewUsage {
  return {
    requestedModel,
    totalCostUsd: 1,
    peakContextTokens: 100,
    peakModel: ids[0] ?? null,
    models: ids.map((id) => ({
      id,
      inputTokens: 1,
      outputTokens: 1,
      cacheReadInputTokens: 1,
      cacheCreationInputTokens: 1,
      thinkingTokens: 0,
      contextWindow: 1_000_000,
      costUsd: 1
    }))
  };
}

describe("local review protocol", () => {
  it("pede os 7 pilares, subagentes e não aprova a PR", () => {
    const prompt = buildLocalReviewPrompt({
      repository: "acme/a",
      number: 10,
      title: "fix",
      baseRef: "main",
      headSha: "aaa1111"
    });

    expect(prompt).toContain("Grounding");
    expect(prompt).toContain("80%");
    expect(prompt).toContain("meta-review");
    expect(prompt).toContain("Nunca aprove");
    expect(prompt).toContain("acme/a");
    expect(prompt).toContain("Modelo: haiku");
    expect(prompt).toContain("modelo `haiku`");
    expect(prompt).not.toContain("{{REVIEW_MODEL}}");
  });

  it("pede o modelo escolhido nas chamadas dos subagentes", () => {
    const prompt = buildLocalReviewPrompt(
      {
        repository: "acme/a",
        number: 10,
        title: "fix",
        baseRef: "main",
        headSha: "aaa1111"
      },
      { model: "sonnet" }
    );
    expect(prompt).toContain("Modelo: sonnet");
    expect(prompt).toContain("modelo `sonnet`");
    expect(prompt).not.toContain("modelo `haiku`");
    expect(prompt).not.toContain("{{REVIEW_MODEL}}");
  });

  it("carrega os 6 agentes e o second pass e o meta-review em haiku", () => {
    const agents = loadLocalReviewAgents();
    expect(agents.map((agent) => agent.name)).toEqual([
      "correctness",
      "security",
      "contracts",
      "tests",
      "delivery",
      "conventions",
      "second-pass",
      "meta-review"
    ]);
    expect(agents.every((agent) => agent.model === "haiku")).toBe(true);

    const args = buildClaudeArgs({ prompt: "revise", model: "haiku", agents });
    expect(args).toContain("--model");
    expect(args).toContain("haiku");
    expect(args).toContain("--output-format");
    expect(args).toContain("stream-json");
    expect(args).toContain("--verbose");
    expect(args).toContain("--permission-mode");
    expect(args).toContain("plan");
  });

  it("aplica o modelo escolhido ao agente principal e aos subagentes", () => {
    const agents = agentsWithModel(loadLocalReviewAgents(), "sonnet");
    expect(agents.every((agent) => agent.model === "sonnet")).toBe(true);
    const args = buildClaudeArgs({ prompt: "revise", model: "sonnet", agents });
    const payload = args[args.indexOf("--agents") + 1];
    expect(args).toContain("sonnet");
    expect(payload).toContain('"model":"sonnet"');
    expect(payload).not.toContain('"model":"haiku"');
  });

  it("tira a chave de API do ambiente do Claude Code", () => {
    const env = claudeChildEnv({
      PATH: "/usr/bin",
      ANTHROPIC_API_KEY: "sk-ant",
      ANTHROPIC_AUTH_TOKEN: "token",
      CLAUDE_CODE_OAUTH_TOKEN: "oauth"
    });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBe("oauth");
    expect(env.PATH).toBe("/usr/bin");
  });
});

describe("local review checkout", () => {
  it("busca a PR por HTTPS com a mesma conta do gh, sem o remoto SSH", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pr-flow-review-"));
    const dir = path.join(root, "data", "review-clones", "jusfy__jusfy-backend");
    fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
    const calls: string[][] = [];

    await checkoutPullRequest({
      root,
      repository: "jusfy/jusfy-backend",
      number: 3459,
      headSha: "abc1234",
      run: async (command, args) => {
        calls.push([command, ...args]);
        return { stdout: "", stderr: "" };
      }
    });

    expect(calls[0]).toEqual([
      "git",
      "-C",
      dir,
      "-c",
      "credential.helper=",
      "-c",
      "credential.helper=!gh auth git-credential",
      "fetch",
      "https://github.com/jusfy/jusfy-backend.git",
      "pull/3459/head"
    ]);
    expect(calls.some((call) => call.includes("origin"))).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
