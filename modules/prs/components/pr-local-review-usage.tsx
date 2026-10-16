import { ptBR } from "@/modules/messages";
import {
  formatTokenCount,
  formatUsd,
  modelDisplayName,
  presentLocalReviewUsage,
  type LocalReviewUsage,
  type LocalReviewUsageRole
} from "@/modules/prs/lib/local-review/local-review-usage";

export function PrLocalReviewUsage({ usage }: { usage: LocalReviewUsage }) {
  const presented = presentLocalReviewUsage(usage);
  const peakModel = usage.models.find((model) => model.id === usage.peakModel) ?? usage.models[0];
  const peakRole = presented.models.find((model) => model.id === usage.peakModel)?.role ?? "both";
  const windowSize = peakModel?.contextWindow ?? usage.models.find((model) => model.contextWindow)?.contextWindow ?? null;
  const percent =
    usage.peakContextTokens !== null && windowSize
      ? Math.min(100, Math.round((usage.peakContextTokens / windowSize) * 100))
      : null;

  return (
    <section className="panel p-5 md:p-6">
      <h2 className="text-lg font-semibold text-[var(--app-text)]">{ptBR.localReview.usageHeading}</h2>
      {presented.chosenLabel ? (
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          {presented.splitRoles
            ? `${ptBR.localReview.usageChosen(presented.chosenLabel)} · ${ptBR.localReview.usageScope}`
            : `${presented.chosenLabel} · ${ptBR.localReview.usageScope}`}
        </p>
      ) : null}
      <div className="mt-4 space-y-4">
        {presented.models.map((model) => (
          <div key={model.id}>
            {presented.splitRoles || presented.models.length > 1 ? (
              <p className="text-sm font-medium text-[var(--app-text)]">
                {modelDisplayName(model.id)}
                {presented.splitRoles ? ` · ${roleLabel(model.role)}` : ""}
              </p>
            ) : null}
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[var(--app-text-muted)] sm:grid-cols-3">
              <UsageStat label={ptBR.localReview.usageInput} value={formatTokenCount(model.inputTokens)} />
              <UsageStat label={ptBR.localReview.usageOutput} value={formatTokenCount(model.outputTokens)} />
              <UsageStat label={ptBR.localReview.usageCacheRead} value={formatTokenCount(model.cacheReadInputTokens)} />
              <UsageStat label={ptBR.localReview.usageCacheCreate} value={formatTokenCount(model.cacheCreationInputTokens)} />
              {model.thinkingTokens > 0 ? (
                <UsageStat label={ptBR.localReview.usageThinking} value={formatTokenCount(model.thinkingTokens)} />
              ) : null}
            </dl>
          </div>
        ))}

        {usage.peakContextTokens !== null && windowSize && percent !== null ? (
          <div>
            <p className="text-sm text-[var(--app-text-soft)]">{peakLabel(peakRole, usage.peakContextTokens, windowSize, percent)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : windowSize ? (
          <p className="text-sm text-[var(--app-text-muted)]">{ptBR.localReview.usageWindow(formatTokenCount(windowSize))}</p>
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{ptBR.localReview.usageWindowUnknown}</p>
        )}

        {usage.totalCostUsd !== null ? (
          <p className="text-sm text-[var(--app-text-muted)]">
            {ptBR.localReview.usageCost(formatUsd(usage.totalCostUsd))} {ptBR.localReview.usageCostNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function roleLabel(role: LocalReviewUsageRole): string {
  if (role === "orchestrator") {
    return ptBR.localReview.usageOrchestrator;
  }
  if (role === "subagents") {
    return ptBR.localReview.usageSubagents;
  }
  return ptBR.localReview.usageScope;
}

function peakLabel(role: LocalReviewUsageRole, tokens: number, windowSize: number, percent: number): string {
  const peak = formatTokenCount(tokens);
  const window = formatTokenCount(windowSize);
  if (role === "orchestrator") {
    return ptBR.localReview.usagePeakOrchestrator(peak, window, percent);
  }
  if (role === "subagents") {
    return ptBR.localReview.usagePeakSubagents(peak, window, percent);
  }
  return ptBR.localReview.usagePeak(peak, window, percent);
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--app-text-muted)]">{label}</dt>
      <dd className="font-mono text-[var(--app-text)]">{value}</dd>
    </div>
  );
}
