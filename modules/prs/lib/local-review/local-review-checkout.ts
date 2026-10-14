import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const repositorySlugSchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
const headShaSchema = z.string().regex(/^[0-9a-f]{7,64}$/i);
const prNumberSchema = z.number().int().positive();

export type CommandRunner = (
  command: string,
  args: string[],
  options?: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv }
) => Promise<{ stdout: string; stderr: string }>;

const prHeadSchema = z.object({
  number: z.number().int().positive(),
  headRefOid: z.string().min(7),
  baseRefName: z.string().min(1)
});

export type ListedPullHead = z.infer<typeof prHeadSchema>;

export async function defaultCommandRunner(
  command: string,
  args: string[],
  options?: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeoutMs,
    env: options?.env,
    maxBuffer: 20 * 1024 * 1024
  });
  return { stdout: result.stdout, stderr: result.stderr };
}

export function reviewCloneDir(root: string, repository: string): string {
  const slug = repositorySlugSchema.parse(repository);
  const [owner, repo] = slug.split("/");
  const parent = path.resolve(root, "data", "review-clones");
  const dir = path.resolve(parent, `${owner}__${repo}`);
  if (!dir.startsWith(parent + path.sep)) {
    throw new Error("Caminho de clone inválido.");
  }
  return dir;
}

export async function listPullRequestHeads(
  repository: string,
  run: CommandRunner = defaultCommandRunner
): Promise<ListedPullHead[]> {
  const slug = repositorySlugSchema.parse(repository);
  const { stdout } = await run("gh", [
    "pr",
    "list",
    "--repo",
    slug,
    "--state",
    "open",
    "--limit",
    "50",
    "--json",
    "number,headRefOid,baseRefName"
  ]);
  const parsed = z.array(prHeadSchema).safeParse(JSON.parse(stdout));
  if (!parsed.success) {
    throw new Error(`gh pr list devolveu um formato inesperado para ${slug}.`);
  }
  return parsed.data;
}

export async function checkoutPullRequest(input: {
  root: string;
  repository: string;
  number: number;
  headSha: string;
  run?: CommandRunner;
}): Promise<string> {
  const slug = repositorySlugSchema.parse(input.repository);
  const number = prNumberSchema.parse(input.number);
  const headSha = headShaSchema.parse(input.headSha);
  const run = input.run ?? defaultCommandRunner;
  const dir = reviewCloneDir(input.root, slug);

  if (!fs.existsSync(path.join(dir, ".git"))) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    await run("gh", ["repo", "clone", slug, dir], { timeoutMs: 3 * 60 * 1000 });
  }

  await run("git", ["-C", dir, "fetch", "origin", `pull/${number}/head`], {
    timeoutMs: 2 * 60 * 1000
  });
  await run("git", ["-C", dir, "checkout", "--force", "--detach", headSha], { timeoutMs: 60 * 1000 });
  await run("git", ["-C", dir, "clean", "-fd"], { timeoutMs: 60 * 1000 });
  return dir;
}
