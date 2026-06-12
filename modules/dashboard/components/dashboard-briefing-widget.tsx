"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { useDashboardBriefing } from "@/modules/dashboard/hooks/use-dashboard-briefing";
import { GEMINI_RATE_LIMIT_LINK } from "@/modules/llm-generation";

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
    <section className="space-y-4" data-testid="dashboard-briefing-widget">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Briefing do dia
          </h2>
          <p className="text-sm text-muted-foreground">
            Mapa de batalha do dia: fechamento de ontem, desbloqueios urgentes e foco de ataque.
            Atualizado automaticamente a cada hora.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => void fetchBriefing()}
          aria-label="Atualizar briefing"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          Atualizar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Hoje: {briefingDay}
        {previousBusinessDay ? ` · Último dia útil: ${previousBusinessDay}` : null}
      </p>

      {loadState === "waiting" && !isLoading ? (
        <Surface variant="dashed" className="p-6 text-sm text-[var(--app-text-muted)]">
          O briefing ainda não foi gerado nesta hora. A rotina automática roda a cada hora; você
          também pode forçar em{" "}
          <strong className="font-medium text-foreground">Devtools → Crons</strong> (
          <em>Dash — briefing</em>
          ).
        </Surface>
      ) : null}

      {isLoading ? (
        <Surface className="flex items-center gap-2 p-6 text-sm text-[var(--app-text-muted)]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando briefing...
        </Surface>
      ) : null}

      {loadState === "missing_api_key" ? (
        <Surface className="p-4 text-sm text-[var(--app-text-muted)]">
          <p>{errorMessage}</p>
          <p className="mt-2">
            Adicione <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> no{" "}
            <code className="rounded bg-muted px-1 py-0.5">.env</code> e reinicie o app.
          </p>
        </Surface>
      ) : null}

      {loadState === "no_input" && errorMessage ? (
        <Surface
          className="p-4 text-sm text-[var(--app-text-muted)]"
          data-testid="dashboard-briefing-no-input"
        >
          <p>{errorMessage}</p>
        </Surface>
      ) : null}

      {loadState === "rate_limited" && errorMessage ? (
        <Surface
          className="border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
          data-testid="dashboard-briefing-rate-limited"
        >
          <p>{errorMessage}</p>
          <p className="mt-2">
            <a
              href={GEMINI_RATE_LIMIT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              Gerenciar limite no Google AI Studio
            </a>
          </p>
        </Surface>
      ) : null}

      {loadState === "error" && errorMessage ? (
        <Surface className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </Surface>
      ) : null}

      {hasSummary && summary ? (
        <Surface
          as="article"
          className="prose prose-sm dark:prose-invert max-w-none p-4 md:p-5 text-[var(--app-text)] prose-headings:text-[var(--app-text)] prose-p:text-[var(--app-text)]/90 prose-strong:text-[var(--app-text)] prose-code:text-[var(--app-text)] prose-a:text-[var(--app-link)] prose-a:underline-offset-2 hover:prose-a:text-[var(--brand-bright)] prose-blockquote:border-[var(--app-border)] prose-blockquote:text-[var(--app-text-muted)] prose-hr:border-[var(--app-border)] prose-li:text-[var(--app-text)]/90"
          data-testid="dashboard-briefing"
        >
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{summary}</ReactMarkdown>
          {generatedAt ? (
            <p className="mt-4 text-xs text-muted-foreground not-prose">
              Atualizado em {new Date(generatedAt).toLocaleString("pt-BR")} · próxima rotina em até
              1 hora
            </p>
          ) : null}
        </Surface>
      ) : null}
    </section>
  );
}
