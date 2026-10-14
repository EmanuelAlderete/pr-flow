"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { Surface } from "@/components/ui/surface";
import { useDashboardBriefing } from "@/modules/dashboard/hooks/use-dashboard-briefing";
import { GEMINI_RATE_LIMIT_LINK } from "@/modules/llm-generation";
import { ptBR } from "@/modules/messages/pt-BR";

type DashboardBriefingWidgetProps = {
  day?: string;
};

export function DashboardBriefingWidget({ day }: DashboardBriefingWidgetProps) {
  const {
    day: briefingDay,
    loadState,
    summary,
    generatedAt,
    previousBusinessDay,
    errorMessage,
    fetchBriefing,
    isLoading,
    hasSummary
  } = useDashboardBriefing(day);

  return (
    <Surface className="flex min-w-0 flex-col space-y-4 p-4" data-testid="dashboard-briefing-widget">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--app-text)]">
              {ptBR.briefing.widgetTitle}
            </h2>
            <HelpHint>{ptBR.briefing.widgetHelp}</HelpHint>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => void fetchBriefing()}
          aria-label={ptBR.briefing.refreshAriaLabel}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {ptBR.briefing.refresh}
        </Button>
      </div>

      <p className="text-xs text-[var(--app-text-muted)]">
        {ptBR.briefing.dayMeta(briefingDay, previousBusinessDay)}
      </p>

      {loadState === "waiting" && !isLoading ? (
        <Surface variant="dashed" className="p-4 text-sm text-[var(--app-text-muted)]">
          {ptBR.briefing.waiting}
        </Surface>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {ptBR.briefing.loading}
        </div>
      ) : null}

      {loadState === "missing_api_key" ? (
        <div className="panel-inset space-y-2 p-4 text-sm text-[var(--app-text-muted)]">
          <p>{errorMessage}</p>
          <p>{ptBR.briefing.missingApiKeyHint}</p>
        </div>
      ) : null}

      {loadState === "no_input" && errorMessage ? (
        <div
          className="panel-inset p-4 text-sm text-[var(--app-text-muted)]"
          data-testid="dashboard-briefing-no-input"
        >
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {loadState === "rate_limited" && errorMessage ? (
        <div
          className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
          data-testid="dashboard-briefing-rate-limited"
        >
          <p>{errorMessage}</p>
          <p>
            <a
              href={GEMINI_RATE_LIMIT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {ptBR.briefing.rateLimitLink}
            </a>
          </p>
        </div>
      ) : null}

      {loadState === "error" && errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {hasSummary && summary ? (
        <article
          className="prose prose-sm dark:prose-invert max-w-none text-[var(--app-text)] prose-headings:text-[var(--app-text)] prose-p:text-[var(--app-text)]/90 prose-strong:text-[var(--app-text)] prose-code:text-[var(--app-text)] prose-a:text-[var(--app-link)] prose-a:underline-offset-2 hover:prose-a:text-[var(--brand-bright)] prose-blockquote:border-[var(--app-border)] prose-blockquote:text-[var(--app-text-muted)] prose-hr:border-[var(--app-border)] prose-li:text-[var(--app-text)]/90"
          data-testid="dashboard-briefing"
        >
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{summary}</ReactMarkdown>
          {generatedAt ? (
            <p className="mt-4 text-xs text-[var(--app-text-muted)] not-prose">
              {ptBR.briefing.updatedAt(new Date(generatedAt).toLocaleString("pt-BR"))}
            </p>
          ) : null}
        </article>
      ) : null}
    </Surface>
  );
}
