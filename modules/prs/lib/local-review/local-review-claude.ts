import {
  claudeAgentPayload,
  loadLocalReviewAgents,
  LOCAL_REVIEW_MODEL,
  type LocalReviewAgent
} from "@/modules/prs/lib/local-review/local-review-protocol";
import {
  defaultCommandRunner,
  type CommandRunner
} from "@/modules/prs/lib/local-review/local-review-checkout";

export const LOCAL_REVIEW_TIMEOUT_MS = 12 * 60 * 1000;

export function resolveReviewModel(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.PR_REVIEW_MODEL?.trim();
  return configured || LOCAL_REVIEW_MODEL;
}

export function claudeChildEnv(
  env: Record<string, string | undefined> = process.env
): Record<string, string | undefined> {
  const next = { ...env };
  delete next.ANTHROPIC_API_KEY;
  delete next.ANTHROPIC_AUTH_TOKEN;
  return next;
}

export function buildClaudeArgs(input: {
  prompt: string;
  model: string;
  agents: LocalReviewAgent[];
}): string[] {
  return [
    "-p",
    input.prompt,
    "--model",
    input.model,
    "--permission-mode",
    "plan",
    "--output-format",
    "json",
    "--allowedTools",
    "Read,Grep,Glob,Agent,Bash(git diff:*),Bash(git log:*),Bash(gh pr diff:*),Bash(gh pr view:*)",
    "--agents",
    JSON.stringify(claudeAgentPayload(input.agents))
  ];
}

export async function runClaudeReview(input: {
  cwd: string;
  prompt: string;
  model?: string;
  run?: CommandRunner;
  env?: NodeJS.ProcessEnv;
}): Promise<string> {
  const run = input.run ?? defaultCommandRunner;
  const model = input.model ?? resolveReviewModel(input.env);
  const agents = loadLocalReviewAgents();
  const args = buildClaudeArgs({ prompt: input.prompt, model, agents });
  const { stdout } = await run("claude", args, {
    cwd: input.cwd,
    timeoutMs: LOCAL_REVIEW_TIMEOUT_MS,
    env: claudeChildEnv(input.env)
  });
  return stdout;
}
