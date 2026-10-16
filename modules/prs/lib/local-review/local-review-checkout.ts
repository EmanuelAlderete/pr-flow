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
  options?: { cwd?: string; timeoutMs?: number; env?: Record<string, string | undefined> }
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
  options?: { cwd?: string; timeoutMs?: number; env?: Record<string, string | undefined> }
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeoutMs,
    env: options?.env as NodeJS.ProcessEnv | undefined,
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

const prViewSchema = prHeadSchema.extend({
  state: z.string()
});

export async function readOpenPullRequestHead(
  repository: string,
  number: number,
  run: CommandRunner = defaultCommandRunner
): Promise<ListedPullHead | null> {
  const slug = repositorySlugSchema.parse(repository);
  const prNumber = prNumberSchema.parse(number);
  const { stdout } = await run("gh", [
    "pr",
    "view",
    String(prNumber),
    "--repo",
    slug,
    "--json",
    "number,headRefOid,baseRefName,state"
  ]);
  const parsed = prViewSchema.safeParse(JSON.parse(stdout));
  if (!parsed.success) {
    throw new Error(`gh pr view devolveu um formato inesperado para ${slug}#${prNumber}.`);
  }
  if (parsed.data.state !== "OPEN") {
    return null;
  }
  return {
    number: parsed.data.number,
    headRefOid: parsed.data.headRefOid,
    baseRefName: parsed.data.baseRefName
  };
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

  const remote = `https://github.com/${slug}.git`;
  const withGhCredentials = [
    "-c",
    "credential.helper=",
    "-c",
    "credential.helper=!gh auth git-credential"
  ];

  if (!fs.existsSync(path.join(dir, ".git"))) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    await run("git", [...withGhCredentials, "clone", remote, dir], { timeoutMs: 3 * 60 * 1000 });
  }

  await run("git", ["-C", dir, ...withGhCredentials, "fetch", remote, `pull/${number}/head`], {
    timeoutMs: 2 * 60 * 1000
  });
  await run("git", ["-C", dir, "checkout", "--force", "--detach", headSha], { timeoutMs: 60 * 1000 });
  await run("git", ["-C", dir, "clean", "-fd"], { timeoutMs: 60 * 1000 });
  return dir;
}
