import { Buffer } from "node:buffer";
import {
  defaultRunner,
  GhCommandError,
  GhUnauthenticatedError,
  type CommandRunner
} from "@/modules/prs/lib/gh-client";
import {
  OPEN_PR_DIFF_MAX_CHARS,
  OPEN_PR_TEMPLATE_PATH
} from "@/modules/prs/lib/open-pr/constants";

export type AuthorBranch = {
  name: string;
};

export type CreatePullRequestInput = {
  repository: string;
  branch: string;
  baseBranch: string;
  title: string;
  body: string;
  reviewers: string[];
};

function parseRepo(repository: string): { owner: string; name: string } {
  const [owner, name] = repository.split("/");
  if (!owner || !name) {
    throw new GhCommandError(`Repositório inválido: ${repository}`);
  }
  return { owner, name };
}

async function assertGhAuthenticated(run: CommandRunner): Promise<void> {
  const auth = await run(["auth", "status"]);
  if (auth.exitCode !== 0) {
    throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
  }
}

export async function getGhAuthenticatedLogin(run: CommandRunner = defaultRunner): Promise<string> {
  await assertGhAuthenticated(run);
  const meCmd = await run(["api", "user", "--jq", ".login"]);
  if (meCmd.exitCode === 0 && meCmd.stdout.trim()) {
    return meCmd.stdout.trim();
  }
  if (/gh auth login|not logged in|authentication/i.test(meCmd.stderr)) {
    throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
  }
  throw new GhCommandError(meCmd.stderr || "Falha ao descobrir usuario autenticado");
}

const authorBranchesQuery = `
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    refs(refPrefix: "refs/heads/", first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        target {
          ... on Commit {
            author { user { login } }
          }
        }
      }
    }
  }
}
`;

export async function listAuthorBranches(
  repository: string,
  githubLogin: string,
  run: CommandRunner = defaultRunner
): Promise<AuthorBranch[]> {
  const { owner, name } = parseRepo(repository);
  const branches: AuthorBranch[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 8; page += 1) {
    const args = [
      "api",
      "graphql",
      "-f",
      `query=${authorBranchesQuery}`,
      "-F",
      `owner=${owner}`,
      "-F",
      `name=${name}`
    ];
    if (cursor) {
      args.push("-F", `cursor=${cursor}`);
    }

    const output = await run(args);
    if (output.exitCode !== 0) {
      if (/gh auth login|not logged in|authentication/i.test(output.stderr)) {
        throw new GhUnauthenticatedError(
          "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
        );
      }
      throw new GhCommandError(output.stderr || `Falha ao listar branches de ${repository}`);
    }

    let payload: {
      data?: {
        repository?: {
          refs?: {
            pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
            nodes?: Array<{
              name?: string;
              target?: { author?: { user?: { login?: string } } };
            }>;
          };
        };
      };
      errors?: Array<{ message?: string }>;
    };

    try {
      payload = JSON.parse(output.stdout) as typeof payload;
    } catch {
      throw new GhCommandError(`Falha ao parsear branches de ${repository}`);
    }

    if (payload.errors?.length) {
      throw new GhCommandError(payload.errors.map((e) => e.message).join("; "));
    }

    const nodes = payload.data?.repository?.refs?.nodes ?? [];
    for (const node of nodes) {
      const branchName = node.name?.trim();
      const authorLogin = node.target?.author?.user?.login?.trim();
      if (!branchName || authorLogin !== githubLogin) {
        continue;
      }
      if (branchName === "master" || branchName === "main") {
        continue;
      }
      branches.push({ name: branchName });
    }

    const pageInfo = payload.data?.repository?.refs?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
      break;
    }
    cursor = pageInfo.endCursor;
  }

  return branches.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchPullRequestTemplate(
  repository: string,
  run: CommandRunner = defaultRunner
): Promise<string> {
  const { owner, name } = parseRepo(repository);
  const output = await run([
    "api",
    `/repos/${owner}/${name}/contents/${OPEN_PR_TEMPLATE_PATH}`,
    "--jq",
    ".content"
  ]);

  if (output.exitCode !== 0) {
    if (/404|Not Found/i.test(output.stderr)) {
      return "";
    }
    throw new GhCommandError(output.stderr || "Falha ao buscar template de PR");
  }

  const encoded = output.stdout.trim().replace(/^"|"$/g, "");
  if (!encoded) {
    return "";
  }

  try {
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    throw new GhCommandError("Falha ao decodificar template de PR");
  }
}

function buildCompareRef(baseBranch: string, branch: string): string {
  return `${encodeURIComponent(baseBranch)}...${encodeURIComponent(branch)}`;
}

type CompareSummary = {
  status?: string;
  ahead_by?: number;
};

async function fetchCompareSummary(
  repository: string,
  baseBranch: string,
  branch: string,
  run: CommandRunner = defaultRunner
): Promise<CompareSummary | null> {
  const { owner, name } = parseRepo(repository);
  const compareRef = buildCompareRef(baseBranch, branch);
  const output = await run([
    "api",
    `/repos/${owner}/${name}/compare/${compareRef}`,
    "--jq",
    "{status: .status, ahead_by: .ahead_by}"
  ]);

  if (output.exitCode !== 0) {
    return null;
  }

  try {
    return JSON.parse(output.stdout) as CompareSummary;
  } catch {
    return null;
  }
}

/** True when all commits of `branch` are contained in `intoBranch` (merged). */
export async function isBranchFullyMergedInto(
  repository: string,
  branch: string,
  intoBranch: string,
  run: CommandRunner = defaultRunner
): Promise<boolean> {
  if (branch === intoBranch) {
    return true;
  }

  const summary = await fetchCompareSummary(repository, intoBranch, branch, run);
  if (!summary) {
    return false;
  }

  return summary.ahead_by === 0 || summary.status === "identical";
}

export async function fetchBranchDiff(
  repository: string,
  branch: string,
  baseBranch: string,
  run: CommandRunner = defaultRunner
): Promise<string> {
  const { owner, name } = parseRepo(repository);
  const compareRef = buildCompareRef(baseBranch, branch);
  const output = await run([
    "api",
    `/repos/${owner}/${name}/compare/${compareRef}`,
    "-H",
    "Accept: application/vnd.github.v3.diff"
  ]);

  if (output.exitCode !== 0) {
    const compareLabel = `${baseBranch}...${branch}`;
    if (!output.stderr.trim() && output.stdout.includes("diff --git ")) {
      throw new GhCommandError(
        `Diff muito grande para processar (${compareLabel}). Reduza o escopo da branch ou edite o corpo manualmente.`
      );
    }
    const detail = output.stderr.trim() || output.stdout.trim();
    throw new GhCommandError(detail || `Falha ao obter diff ${compareLabel}`);
  }

  const diff = output.stdout;
  if (diff.length <= OPEN_PR_DIFF_MAX_CHARS) {
    return diff;
  }

  return `${diff.slice(0, OPEN_PR_DIFF_MAX_CHARS)}\n\n… (diff truncado para geração com IA)`;
}

export async function createPullRequest(
  input: CreatePullRequestInput,
  run: CommandRunner = defaultRunner
): Promise<{ url: string; number: number }> {
  const args = [
    "pr",
    "create",
    "--repo",
    input.repository,
    "--base",
    input.baseBranch,
    "--head",
    input.branch,
    "--title",
    input.title,
    "--body",
    input.body,
    "--assignee",
    "@me"
  ];

  if (input.reviewers.length > 0) {
    args.push("--reviewer", input.reviewers.join(","));
  }

  const output = await run(args);
  if (output.exitCode !== 0) {
    if (/gh auth login|not logged in|authentication/i.test(output.stderr)) {
      throw new GhUnauthenticatedError(
        "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
      );
    }
    throw new GhCommandError(output.stderr || "Falha ao criar pull request");
  }

  const urlMatch = output.stdout.match(/https:\/\/github\.com\/[^\s]+/);
  const url = urlMatch?.[0] ?? "";
  const numberMatch = url.match(/\/pull\/(\d+)/);
  const number = numberMatch ? Number(numberMatch[1]) : 0;

  return { url, number };
}
