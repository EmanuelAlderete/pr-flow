import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_RELATIVE = path.join(".claude", "skills", "trusted-pr-review", "SKILL.md");
const AGENTS_RELATIVE = path.join(".claude", "agents");

const AGENT_FILES = [
  "correctness.md",
  "security.md",
  "contracts.md",
  "tests.md",
  "delivery.md",
  "conventions.md",
  "second-pass.md",
  "meta-review.md"
] as const;

export const LOCAL_REVIEW_CONFIDENCE_THRESHOLD = 0.8;
export const LOCAL_REVIEW_MODEL = "haiku";

export type LocalReviewAgent = {
  name: string;
  description: string;
  prompt: string;
  model: string;
  tools: string[];
};

export type LocalReviewTarget = {
  repository: string;
  number: number;
  title: string;
  baseRef: string;
  headSha: string;
};

export function prFlowRoot(): string {
  const fromEnv = process.env.PR_FLOW_ROOT?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, SKILL_RELATIVE))) {
    return cwd;
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../..");
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) {
      meta[key] = value;
    }
  }

  return { meta, body: match[2].trim() };
}

export function loadLocalReviewSkill(root = prFlowRoot()): string {
  const file = path.join(root, SKILL_RELATIVE);
  return fs.readFileSync(file, "utf8");
}

export function loadLocalReviewAgents(root = prFlowRoot()): LocalReviewAgent[] {
  return AGENT_FILES.map((fileName) => {
    const raw = fs.readFileSync(path.join(root, AGENTS_RELATIVE, fileName), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const name = meta.name ?? fileName.replace(/\.md$/, "");
    const tools = (meta.tools ?? "Read, Grep, Glob")
      .split(",")
      .map((tool) => tool.trim())
      .filter(Boolean);

    return {
      name,
      description: meta.description ?? name,
      prompt: body,
      model: meta.model ?? LOCAL_REVIEW_MODEL,
      tools
    };
  });
}

export function claudeAgentPayload(agents: LocalReviewAgent[]): Record<string, unknown> {
  return Object.fromEntries(
    agents.map((agent) => [
      agent.name,
      {
        description: agent.description,
        prompt: agent.prompt,
        model: agent.model,
        tools: agent.tools
      }
    ])
  );
}

export function buildLocalReviewPrompt(target: LocalReviewTarget, skill = loadLocalReviewSkill()): string {
  const { body } = parseFrontmatter(skill);
  return [
    `Repositório: ${target.repository}`,
    `PR: #${target.number}`,
    `Título: ${target.title}`,
    `Base: ${target.baseRef}`,
    `Head: ${target.headSha}`,
    "",
    body
  ].join("\n");
}
