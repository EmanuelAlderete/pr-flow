import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { MonitoredPrRaw, PrReview } from "@/modules/prs/lib/domain";
import { ghLogger } from "@/modules/prs/lib/gh-logger";

const execFileAsync = promisify(execFile);

/** Node execFile default maxBuffer is 1MB; PR compare diffs often exceed that. */
const GH_EXEC_MAX_BUFFER_BYTES = 20 * 1024 * 1024;

export interface CommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type CommandRunner = (args: string[]) => Promise<CommandOutput>;

export class GhUnauthenticatedError extends Error {}

export class GhCommandError extends Error {}

const query = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 50, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}, headRefName: null) {
      nodes {
        id
        number
        title
        url
        createdAt
        mergeStateStatus
        mergeable
        author {
          login
        }
        reviewThreads(first: 100) {
          nodes {
            isResolved
          }
        }
        reviewRequests(first: 100) {
          nodes {
            requestedReviewer {
              ... on User {
                login
              }
            }
          }
        }
        reviews(first: 100) {
          nodes {
            state
            submittedAt
            author {
              login
            }
          }
        }
      }
    }
  }
}
`;

async function defaultRunner(args: string[]): Promise<CommandOutput> {
  const startTime = Date.now();
  try {
    const result = await execFileAsync("gh", args, { maxBuffer: GH_EXEC_MAX_BUFFER_BYTES });
    const duration = Date.now() - startTime;
    ghLogger.logCommand("gh", args, 0, result.stdout, result.stderr, duration);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as {
      stdout?: string;
      stderr?: string;
      code?: string | number;
      message?: string;
    };
    const stdout = err.stdout ?? "";
    const stderr = err.stderr ?? "";
    const exitCode = typeof err.code === "number" ? err.code : 1;
    ghLogger.logCommand("gh", args, exitCode, stdout, stderr, duration);
    return { stdout, stderr, exitCode };
  }
}

export { defaultRunner };

function parseRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new GhCommandError(`Invalid repository: ${repo}`);
  }
  return { owner, name };
}

function isGhUnauthenticated(stderr: string): boolean {
  return /gh auth login|not logged in|authentication/i.test(stderr);
}

function isTransientGhJsonIssue(stderr: string): boolean {
  return /unexpected end of json input/i.test(stderr);
}

async function getAuthenticatedLogin(run: CommandRunner): Promise<string> {
  const meCmd = await run(["api", "user", "--jq", ".login"]);
  if (meCmd.exitCode === 0 && meCmd.stdout.trim().length > 0) {
    return meCmd.stdout.trim();
  }

  if (isGhUnauthenticated(meCmd.stderr)) {
    throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
  }

  if (!isTransientGhJsonIssue(meCmd.stderr)) {
    throw new GhCommandError(meCmd.stderr || "Falha ao descobrir usuario autenticado");
  }

  const fallback = await run(["api", "user"]);
  if (fallback.exitCode !== 0) {
    if (isGhUnauthenticated(fallback.stderr)) {
      throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
    }
    throw new GhCommandError(fallback.stderr || "Falha ao descobrir usuario autenticado");
  }

  if (!fallback.stdout.trim()) {
    throw new GhCommandError("Falha ao descobrir usuario autenticado: resposta vazia do gh api user");
  }

  let payload: any;
  try {
    payload = JSON.parse(fallback.stdout);
  } catch (error) {
    const parseError = error instanceof Error ? error.message : String(error);
    throw new GhCommandError(`Falha ao parsear usuario autenticado: ${parseError}`);
  }

  const login = typeof payload?.login === "string" ? payload.login.trim() : "";
  if (!login) {
    throw new GhCommandError("Falha ao descobrir usuario autenticado: campo login ausente");
  }
  return login;
}

export interface CollectOpenPrsResult {
  prs: MonitoredPrRaw[];
  githubLogin: string;
}

export type CollectOpenAuthorPrsResult = CollectOpenPrsResult;

function mapGraphqlPrNode(
  pr: {
    id: string;
    number: number;
    title: string;
    url: string;
    createdAt?: string;
    mergeable?: string;
    author?: { login?: string };
    reviewThreads?: { nodes?: Array<{ isResolved?: boolean }> };
    reviewRequests?: { nodes?: Array<{ requestedReviewer?: { login?: string } }> };
    reviews?: { nodes?: Array<{ state?: string; submittedAt?: string; author?: { login?: string } }> };
  },
  repo: string
): MonitoredPrRaw {
  const requestedReviewers =
    pr.reviewRequests?.nodes
      ?.map((node) => node.requestedReviewer?.login)
      .filter((value): value is string => Boolean(value)) ?? [];

  const reviews: PrReview[] =
    pr.reviews?.nodes
      ?.map((node) => ({
        login: node.author?.login ?? "",
        state: node.state ?? "",
        submittedAt: node.submittedAt ?? new Date(0).toISOString()
      }))
      .filter((review) => review.login.length > 0) ?? [];

  const hasUnresolvedComments = pr.reviewThreads?.nodes?.some((thread) => thread.isResolved === false) ?? false;

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    createdAt: pr.createdAt ?? new Date(0).toISOString(),
    repository: repo,
    authorLogin: pr.author?.login,
    requestedReviewers,
    reviews,
    hasConflicts: pr.mergeable === "CONFLICTING",
    hasUnresolvedComments
  };
}

export async function collectOpenPrsFromRepos(
  repos: string[],
  run: CommandRunner = defaultRunner
): Promise<CollectOpenPrsResult> {
  const auth = await run(["auth", "status"]);
  if (auth.exitCode !== 0) {
    throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
  }

  const githubLogin = await getAuthenticatedLogin(run);
  const rows: MonitoredPrRaw[] = [];

  for (const repo of repos) {
    const { owner, name } = parseRepo(repo);
    const output = await run(["api", "graphql", "-f", `query=${query}`, "-F", `owner=${owner}`, "-F", `name=${name}`]);

    if (output.exitCode !== 0) {
      if (isGhUnauthenticated(output.stderr)) {
        throw new GhUnauthenticatedError(
      "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`."
    );
      }
      throw new GhCommandError(output.stderr || "Falha ao consultar GitHub GraphQL");
    }

    if (!output.stdout.trim()) {
      throw new GhCommandError(`GraphQL retornou resposta vazia para ${repo}. Stderr: ${output.stderr || "(vazio)"}`);
    }

    let payload: any;
    try {
      payload = JSON.parse(output.stdout);
    } catch (error) {
      const parseError = error instanceof Error ? error.message : String(error);
      throw new GhCommandError(`Falha ao parsear resposta GraphQL para ${repo}: ${parseError}. Resposta: ${output.stdout.substring(0, 200)}`);
    }

    if (payload.errors && Array.isArray(payload.errors) && payload.errors.length > 0) {
      const errorMessages = payload.errors.map((e: any) => e.message).join("; ");
      throw new GhCommandError(`Erro GraphQL para ${repo}: ${errorMessages}`);
    }

    const data = payload.data as {
      repository?: {
        pullRequests?: {
          nodes?: Array<{
            id: string;
            number: number;
            title: string;
            url: string;
            createdAt?: string;
            mergeStateStatus?: string;
            mergeable?: string;
            author?: { login?: string };
            reviewThreads?: { nodes?: Array<{ isResolved?: boolean }> };
            reviewRequests?: { nodes?: Array<{ requestedReviewer?: { login?: string } }> };
            reviews?: { nodes?: Array<{ state?: string; submittedAt?: string; author?: { login?: string } }> };
          }>;
        };
      };
    } | undefined;

    const prs = data?.repository?.pullRequests?.nodes ?? [];
    for (const pr of prs) {
      rows.push(mapGraphqlPrNode(pr, repo));
    }
  }

  return { prs: rows, githubLogin };
}

export async function collectOpenAuthorPrs(
  repos: string[],
  run: CommandRunner = defaultRunner
): Promise<CollectOpenAuthorPrsResult> {
  const { prs, githubLogin } = await collectOpenPrsFromRepos(repos, run);
  return {
    prs: prs.filter((pr) => pr.authorLogin === githubLogin),
    githubLogin
  };
}
