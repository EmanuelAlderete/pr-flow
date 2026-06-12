"use client";

import Link from "next/link";
import { BarChart3, Clock3, GitPullRequestArrow, Snowflake } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import {
  formatAverageOpenDays,
  formatAverageTimeToFirstReview,
  type PrInsights
} from "@/modules/prs/lib/pr-metrics";

type PrInsightsPanelProps = {
  insights: PrInsights;
};

function InsightStat({
  icon: Icon,
  label,
  value,
  href,
  highlight = false
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1 rounded-lg border px-3 py-2.5 ${
        highlight
          ? "border-[var(--brand)]/40 bg-[var(--brand)]/10"
          : "border-[var(--app-border)]/70 bg-[var(--app-surface)]/40"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span>{label}</span>
      </div>
      <p className="text-xl font-semibold tracking-tight text-[var(--app-text)]">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="min-w-0 flex-1 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export function PrInsightsPanel({ insights }: PrInsightsPanelProps) {
  const averageOpenLabel = formatAverageOpenDays(insights.averageOpenDays);
  const averageFirstReviewLabel = formatAverageTimeToFirstReview(insights.averageTimeToFirstReviewHours);

  return (
    <Surface
      role="region"
      aria-label="Insights de PRs"
      className="panel flex flex-col gap-3 p-4"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-[var(--brand)]" aria-hidden />
        <h2 className="text-sm font-semibold text-[var(--app-text)]">Insights</h2>
        <span className="text-xs text-[var(--app-text-muted)]">
          {insights.openPrCount} PR{insights.openPrCount === 1 ? "" : "s"} aberta
          {insights.openPrCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightStat
          icon={Snowflake}
          label="PRs esfriando"
          value={String(insights.coolingPrCount)}
          highlight={insights.coolingPrCount > 0}
        />
        <InsightStat
          icon={Clock3}
          label="Tempo médio aberto"
          value={averageOpenLabel}
        />
        <InsightStat
          icon={GitPullRequestArrow}
          label="Pendentes na fila"
          value={String(insights.pendingReviewCount)}
          href={insights.pendingReviewCount > 0 ? "/prs/reviews?filter=pending" : undefined}
          highlight={insights.pendingReviewCount > 0}
        />
        {insights.averageTimeToFirstReviewHours !== null ? (
          <InsightStat
            icon={BarChart3}
            label="Tempo até 1ª review"
            value={averageFirstReviewLabel}
          />
        ) : null}
      </div>
    </Surface>
  );
}
