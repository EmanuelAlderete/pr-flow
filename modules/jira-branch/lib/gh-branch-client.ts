import {
  defaultRunner,
  GhCommandError,
  GhUnauthenticatedError,
  type CommandRunner
} from "@/modules/prs/lib/gh-client";

function parseRepo(repository: string): { owner: string; name: string } {
  const [owner, name] = repository.split("/");
  if (!owner || !name) {
    throw new GhCommandError(`Repositório inválido: ${repository}`);
  }
  return { owner, name };
}

function encodeRefBranch(branch: string): string {
  return encodeURIComponent(branch.trim());
}

export async function getRemoteBranchSha(
  repository: string,
  branch: string,
  run: CommandRunner = defaultRunner
): Promise<string | null> {
  const { owner, name } = parseRepo(repository);
  const output = await run([
    "api",
    `/repos/${owner}/${name}/git/ref/heads/${encodeRefBranch(branch)}`,
    "--jq",
    ".object.sha"
  ]);

  if (output.exitCode !== 0) {
    if (/404|Not Found/i.test(output.stderr) || /404|Not Found/i.test(output.stdout)) {
      return null;
    }
    if (/gh auth login|not logged in|authentication/i.test(output.stderr)) {
      throw new GhUnauthenticatedError(
        "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
      );
    }
    throw new GhCommandError(output.stderr || `Falha ao buscar branch ${branch} em ${repository}`);
  }

  const sha = output.stdout.trim().replace(/^"|"$/g, "");
  return sha.length > 0 ? sha : null;
}

export async function remoteBranchExists(
  repository: string,
  branch: string,
  run: CommandRunner = defaultRunner
): Promise<boolean> {
  const sha = await getRemoteBranchSha(repository, branch, run);
  return sha !== null;
}

export async function createRemoteBranch(
  repository: string,
  branch: string,
  baseSha: string,
  run: CommandRunner = defaultRunner
): Promise<void> {
  const { owner, name } = parseRepo(repository);
  const output = await run([
    "api",
    `/repos/${owner}/${name}/git/refs`,
    "-f",
    `ref=refs/heads/${branch}`,
    "-f",
    `sha=${baseSha}`
  ]);

  if (output.exitCode !== 0) {
    if (/gh auth login|not logged in|authentication/i.test(output.stderr)) {
      throw new GhUnauthenticatedError(
        "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
      );
    }
    throw new GhCommandError(output.stderr || `Falha ao criar branch ${branch} em ${repository}`);
  }
}
