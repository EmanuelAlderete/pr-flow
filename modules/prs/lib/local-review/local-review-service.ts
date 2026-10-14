import { loadPrMonitorCacheAllowStale } from "@/modules/prs/lib/pr-cache-repository";
import {
  checkoutPullRequest,
  defaultCommandRunner,
  listPullRequestHeads,
  type CommandRunner
} from "@/modules/prs/lib/local-review/local-review-checkout";
import { resolveReviewModel, runClaudeReview } from "@/modules/prs/lib/local-review/local-review-claude";
import { pickNextLocalReview } from "@/modules/prs/lib/local-review/local-review-candidates";
import { buildLocalReviewPrompt, prFlowRoot } from "@/modules/prs/lib/local-review/local-review-protocol";
import {
  claimLocalReview,
  completeLocalReview,
  failLocalReview,
  listLocalReviews
} from "@/modules/prs/lib/local-review/local-review-repository";
import { applyReviewPolicy, parseLocalReviewReport } from "@/modules/prs/lib/local-review/local-review-report";

export type LocalReviewRunResult = {
  status: "ok" | "skipped" | "error";
  message: string;
  repository?: string;
  prNumber?: number;
  findingCount?: number;
};

export async function runLocalPrReview(input?: {
  run?: CommandRunner;
  now?: Date;
  root?: string;
  manual?: boolean;
}): Promise<LocalReviewRunResult> {
  const now = input?.now ?? new Date();
  const run = input?.run ?? defaultCommandRunner;

  try {
    await run("claude", ["--version"], { timeoutMs: 20_000 });
  } catch (error) {
    if (isMissingCommand(error)) {
      return { status: "skipped", message: explainReviewError(error, "claude") };
    }
    return { status: "error", message: explainReviewError(error, "claude") };
  }

  const cached = await loadPrMonitorCacheAllowStale();
  const openPrs = cached?.data ?? [];
  if (openPrs.length === 0) {
    return { status: "skipped", message: "Nenhuma PR aberta no cache para revisar." };
  }

  const repositories = [...new Set(openPrs.map((pr) => pr.repository))];
  let heads;
  try {
    const listed = await Promise.all(
      repositories.map(async (repository) => {
        const pulls = await listPullRequestHeads(repository, run);
        return pulls.map((pull) => ({
          repository,
          number: pull.number,
          headSha: pull.headRefOid,
          baseRef: pull.baseRefName
        }));
      })
    );
    heads = listed.flat();
  } catch (error) {
    return { status: "error", message: explainReviewError(error, "gh") };
  }

  const reviews = await listLocalReviews();
  const pick = pickNextLocalReview({
    openPrs,
    heads,
    reviews: reviews.map((review) => ({
      repository: review.repository,
      prNumber: review.prNumber,
      headSha: review.headSha,
      status: review.status,
      updatedAt: review.updatedAt
    })),
    now,
    retryErrorAfterMs: input?.manual ? 0 : undefined
  });

  if (pick.status === "busy") {
    return { status: "skipped", message: "Já existe uma revisão local em andamento." };
  }
  if (pick.status === "empty") {
    return { status: "skipped", message: "Nenhuma PR aberta com commit novo para revisar." };
  }

  const candidate = pick.candidate;
  const model = resolveReviewModel();
  await claimLocalReview({
    repository: candidate.repository,
    prNumber: candidate.number,
    prId: candidate.id,
    headSha: candidate.headSha,
    baseRef: candidate.baseRef,
    model,
    now
  });

  try {
    const root = input?.root ?? prFlowRoot();
    const cwd = await checkoutPullRequest({
      root,
      repository: candidate.repository,
      number: candidate.number,
      headSha: candidate.headSha,
      run
    });
    const prompt = buildLocalReviewPrompt({
      repository: candidate.repository,
      number: candidate.number,
      title: candidate.title,
      baseRef: candidate.baseRef,
      headSha: candidate.headSha
    });
    const raw = await runClaudeReview({ cwd, prompt, model, run });
    const report = applyReviewPolicy(parseLocalReviewReport(raw));
    const finished = new Date();
    await completeLocalReview({
      repository: candidate.repository,
      prNumber: candidate.number,
      headSha: candidate.headSha,
      summary: report.summary,
      report: JSON.stringify(report),
      now: finished
    });

    const findingCount = report.findings.length;
    return {
      status: "ok",
      message: `Revisão local de ${candidate.repository}#${candidate.number} concluída (${findingCount} achados).`,
      repository: candidate.repository,
      prNumber: candidate.number,
      findingCount
    };
  } catch (error) {
    const message = explainReviewError(error, "claude");
    await failLocalReview({
      repository: candidate.repository,
      prNumber: candidate.number,
      headSha: candidate.headSha,
      error: message,
      now: new Date()
    });
    return {
      status: "error",
      message,
      repository: candidate.repository,
      prNumber: candidate.number
    };
  }
}

function explainReviewError(error: unknown, command: "claude" | "gh"): string {
  if (isMissingCommand(error)) {
    if (command === "claude") {
      return "Claude Code não está no PATH. Instale o CLI e entre com a assinatura (`claude setup-token`). Não defina ANTHROPIC_API_KEY nesse processo.";
    }
    return "GitHub CLI (gh) não está no PATH.";
  }
  return error instanceof Error ? error.message : "Falha na revisão local.";
}

function isMissingCommand(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
  );
}
