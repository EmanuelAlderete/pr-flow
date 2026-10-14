import { describe, expect, it } from "vitest";
import { pickNextLocalReview } from "@/modules/prs/lib/local-review/local-review-candidates";
import { buildClaudeArgs, claudeChildEnv } from "@/modules/prs/lib/local-review/local-review-claude";
import { loadLocalReviewAgents, buildLocalReviewPrompt } from "@/modules/prs/lib/local-review/local-review-protocol";
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

describe("local review report", () => {
  it("descarta achado incerto e achado derrubado pelo meta-review", () => {
    const applied = applyReviewPolicy(report);
    expect(applied.findings.map((finding) => finding.message)).toEqual(["retry ignora null"]);
  });

  it("lê o JSON de dentro do envelope do Claude Code", () => {
    const parsed = parseLocalReviewReport(JSON.stringify({ type: "result", result: JSON.stringify(report) }));
    expect(parsed.summary).toBe(report.summary);
  });
});

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
    expect(args).toContain("--permission-mode");
    expect(args).toContain("plan");
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
