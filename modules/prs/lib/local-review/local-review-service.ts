import {
  loadPrMonitorCacheAllowStale,
  loadPrReviewerQueueCacheAllowStale
} from "@/modules/prs/lib/pr-cache-repository";
import {
  checkoutPullRequest,
  defaultCommandRunner,
  readOpenPullRequestHead,
  type CommandRunner
} from "@/modules/prs/lib/local-review/local-review-checkout";
import { resolveReviewModel, runClaudeReview } from "@/modules/prs/lib/local-review/local-review-claude";
import {
  pickNextLocalReview,
  resolveTargetedReview,
  type LocalReviewCandidate
} from "@/modules/prs/lib/local-review/local-review-candidates";
import { buildLocalReviewPrompt, prFlowRoot } from "@/modules/prs/lib/local-review/local-review-protocol";
import {
  claimLocalReview,
  completeLocalReview,
  failLocalReview,
  listLocalReviews
} from "@/modules/prs/lib/local-review/local-review-repository";
import { applyReviewPolicy, parseLocalReviewReport } from "@/modules/prs/lib/local-review/local-review-report";
import { extractLocalReviewUsage, isolateClaudeResult } from "@/modules/prs/lib/local-review/local-review-usage";
import { ptBR } from "@/modules/messages";

export type LocalReviewRunResult = {
  status: "ok" | "started" | "skipped" | "error";
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

  const cached = await loadPrReviewerQueueCacheAllowStale();
  const openPrs = (cached?.data ?? [])
    .filter((pr) => pr.myReviewStatus !== "dismissed")
    .map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      repository: pr.repository,
      createdAt: "",
      priority: pr.myReviewStatus === "pending" ? 0 : 1
    }));
  if (openPrs.length === 0) {
    return { status: "skipped", message: "Nenhuma PR de colega na fila para revisar." };
  }

  let heads;
  try {
    const listed = await Promise.all(
      openPrs.map(async (pr) => {
        const pull = await readOpenPullRequestHead(pr.repository, pr.number, run);
        if (!pull) {
          return null;
        }
        return {
          repository: pr.repository,
          number: pull.number,
          headSha: pull.headRefOid,
          baseRef: pull.baseRefName
        };
      })
    );
    heads = listed.flatMap((head) => (head ? [head] : []));
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
    return { status: "skipped", message: "Nenhuma PR de colega com commit novo para revisar." };
  }

  const candidate = pick.candidate;
  const model = resolveReviewModel();
  await claimReview(candidate, now, model);
  return executeClaimedReview({ candidate, run, root: input?.root, model });
}

export async function startLocalPrReview(input: {
  repository: string;
  number: number;
  model?: string;
  run?: CommandRunner;
  now?: Date;
  root?: string;
}): Promise<LocalReviewRunResult> {
  const now = input.now ?? new Date();
  const run = input.run ?? defaultCommandRunner;

  try {
    await run("claude", ["--version"], { timeoutMs: 20_000 });
  } catch (error) {
    if (isMissingCommand(error)) {
      return { status: "skipped", message: explainReviewError(error, "claude") };
    }
    return { status: "error", message: explainReviewError(error, "claude") };
  }

  const [queue, monitor] = await Promise.all([
    loadPrReviewerQueueCacheAllowStale(),
    loadPrMonitorCacheAllowStale()
  ]);
  const openPrs = mergeTriggerablePullRequests([
    ...(queue?.data ?? []),
    ...(monitor?.data ?? [])
  ]);
  const reviews = await listLocalReviews();
  let head;
  try {
    const pull = await readOpenPullRequestHead(input.repository, input.number, run);
    head = pull
      ? {
          repository: input.repository,
          number: pull.number,
          headSha: pull.headRefOid,
          baseRef: pull.baseRefName
        }
      : null;
  } catch (error) {
    return { status: "error", message: explainReviewError(error, "gh") };
  }

  const decision = resolveTargetedReview({
    repository: input.repository,
    number: input.number,
    openPrs,
    heads: head ? [head] : [],
    reviews: reviews.map((review) => ({
      repository: review.repository,
      prNumber: review.prNumber,
      headSha: review.headSha,
      status: review.status,
      updatedAt: review.updatedAt
    })),
    now
  });

  if (decision.status === "missing") {
    return { status: "skipped", message: ptBR.localReview.missing };
  }
  if (decision.status === "closed") {
    return { status: "skipped", message: ptBR.localReview.closed };
  }
  if (decision.status === "already") {
    return {
      status: "skipped",
      message: ptBR.localReview.already,
      repository: input.repository,
      prNumber: input.number
    };
  }
  if (decision.status === "busy") {
    const repo = decision.repository.slice(decision.repository.lastIndexOf("/") + 1);
    return {
      status: "skipped",
      message: ptBR.localReview.busyOther(repo, decision.prNumber),
      repository: decision.repository,
      prNumber: decision.prNumber
    };
  }

  const candidate = decision.candidate;
  const model = input.model ?? resolveReviewModel();
  await claimReview(candidate, now, model);
  void executeClaimedReview({ candidate, run, root: input.root, model }).catch(() => undefined);
  const repo = candidate.repository.slice(candidate.repository.lastIndexOf("/") + 1);
  return {
    status: "started",
    message: ptBR.localReview.started(repo, candidate.number),
    repository: candidate.repository,
    prNumber: candidate.number
  };
}

async function claimReview(candidate: LocalReviewCandidate, now: Date, model: string): Promise<void> {
  await claimLocalReview({
    repository: candidate.repository,
    prNumber: candidate.number,
    prId: candidate.id,
    headSha: candidate.headSha,
    baseRef: candidate.baseRef,
    model,
    now
  });
}

async function executeClaimedReview(input: {
  candidate: LocalReviewCandidate;
  run: CommandRunner;
  root?: string;
  model: string;
}): Promise<LocalReviewRunResult> {
  const { candidate, run, model } = input;
  try {
    const root = input.root ?? prFlowRoot();
    const cwd = await checkoutPullRequest({
      root,
      repository: candidate.repository,
      number: candidate.number,
      headSha: candidate.headSha,
      run
    });
    const prompt = buildLocalReviewPrompt(
      {
        repository: candidate.repository,
        number: candidate.number,
        title: candidate.title,
        baseRef: candidate.baseRef,
        headSha: candidate.headSha
      },
      { model }
    );
    const raw = await runClaudeReview({ cwd, prompt, model, run });
    const report = applyReviewPolicy(parseLocalReviewReport(isolateClaudeResult(raw)));
    const usage = extractLocalReviewUsage(raw);
    const finished = new Date();
    await completeLocalReview({
      repository: candidate.repository,
      prNumber: candidate.number,
      headSha: candidate.headSha,
      summary: report.summary,
      report: JSON.stringify(report),
      usage: usage ? JSON.stringify({ ...usage, requestedModel: model }) : null,
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

function mergeTriggerablePullRequests(
  pulls: Array<{
    id: string;
    number: number;
    title: string;
    url: string;
    repository: string;
    createdAt?: string;
  }>
) {
  const byKey = new Map<string, (typeof pulls)[number]>();
  for (const pull of pulls) {
    const key = `${pull.repository}#${pull.number}`;
    if (!byKey.has(key)) {
      byKey.set(key, pull);
    }
  }
  return [...byKey.values()].map((pull) => ({
    id: pull.id,
    number: pull.number,
    title: pull.title,
    url: pull.url,
    repository: pull.repository,
    createdAt: pull.createdAt ?? ""
  }));
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
