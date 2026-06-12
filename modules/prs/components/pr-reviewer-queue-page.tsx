"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  GitPullRequestArrow,
  Loader2,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { StaleDataBanner } from "@/components/stale-data-banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { isReviewerQueueWithData } from "@/modules/app/lib/sync-data-helpers";
import { PrReviewerQueueItem } from "@/modules/prs/components/pr-reviewer-queue-item";
import { usePrReviewerQueueSync } from "@/modules/prs/hooks/use-pr-reviewer-queue-sync";
import type { MyReviewStatus, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import {
  type ReviewQueueFilter,
  reviewQueueFilterLabel
} from "@/modules/prs/lib/review-queue-status";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: ReviewQueueFilter[] = ["all", "pending", "reviewed", "dismissed"];

function formatSyncedAt(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function countByStatus(data: ReviewerQueuePr[]) {
  return data.reduce(
    (counts, pr) => {
      counts[pr.myReviewStatus] += 1;
      return counts;
    },
    { pending: 0, reviewed: 0, dismissed: 0 } satisfies Record<MyReviewStatus, number>
  );
}

function filterQueue(data: ReviewerQueuePr[], filter: ReviewQueueFilter): ReviewerQueuePr[] {
  if (filter === "all") {
    return data;
  }
  return data.filter((pr) => pr.myReviewStatus === filter);
}

function ReviewQueueCardSkeleton() {
  return (
    <Surface className="review-queue-card review-queue-card--skeleton p-0">
      <div className="review-queue-card__main">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="mt-3 h-5 w-full rounded-md" />
        <Skeleton className="mt-2 h-5 w-[84%] rounded-md" />
        <Skeleton className="mt-4 h-4 w-32 rounded-md" />
      </div>
    </Surface>
  );
}

export function PrReviewerQueuePage() {
  const { response, loading, isFetching, refresh } = usePrReviewerQueueSync();
  const [filter, setFilter] = useState<ReviewQueueFilter>("all");

  const hasData = isReviewerQueueWithData(response);
  const okData = hasData ? response.data : [];
  const counts = useMemo(() => countByStatus(okData), [okData]);
  const filtered = useMemo(() => filterQueue(okData, filter), [okData, filter]);
  const pendingHighlight = counts.pending > 0;

  if (loading && response === null) {
    return (
      <section className="review-queue-page flex flex-col gap-4" aria-label="Fila de revisão">
        <Surface className="review-queue-page__toolbar panel overflow-hidden p-0">
          <div className="review-queue-page__toolbar-head">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full rounded-md" />
          </div>
          <div className="review-queue-page__toolbar-body">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </Surface>
        <ul className="review-queue-page__grid" aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index}>
              <ReviewQueueCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const syncedAt = hasData ? formatSyncedAt(response.fetchedAt) : null;
  const githubLogin = hasData ? response.githubLogin : null;

  return (
    <section className="review-queue-page flex flex-col gap-4" aria-label="Fila de revisão">
      {response?.status === "stale" ? (
        <StaleDataBanner
          message={response.message}
          fetchedAt={response.fetchedAt}
          onRetry={() => void refresh()}
          isRetrying={isFetching}
        />
      ) : null}
      <Surface className="review-queue-page__toolbar panel overflow-hidden p-0">
        <div className="review-queue-page__toolbar-head">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="review-queue-page__eyebrow">
              <span className="jira-task-dialog__key-dot" aria-hidden />
              Sua fila de revisão
            </p>
            <p className="review-queue-page__subtitle">
              {githubLogin ? (
                <>
                  PRs abertas em que <strong className="text-[var(--app-text)]">{githubLogin}</strong> é revisor
                </>
              ) : (
                "PRs abertas em que você é revisor solicitado."
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="review-queue-page__refresh shrink-0"
            disabled={isFetching}
            onClick={() => void refresh()}
            aria-label="Atualizar fila de revisão"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Atualizar
          </Button>
        </div>

        {hasData ? (
          <div className="review-queue-page__toolbar-body">
            <div className="review-queue-page__stats" aria-label="Resumo da fila">
              <span
                className={cn(
                  "review-queue-page__stat",
                  pendingHighlight && "review-queue-page__stat--pending"
                )}
              >
                <Clock3 className="size-3.5" aria-hidden />
                <strong>{counts.pending}</strong>
                {counts.pending === 1 ? " pendente" : " pendentes"}
              </span>
              <span className="review-queue-page__stat">
                <CheckCircle2 className="size-3.5 text-emerald-400/90" aria-hidden />
                <strong>{counts.reviewed}</strong>
                {counts.reviewed === 1 ? " avaliada" : " avaliadas"}
              </span>
              <span className="review-queue-page__stat">
                <RotateCcw className="size-3.5" aria-hidden />
                <strong>{counts.dismissed}</strong>
                {counts.dismissed === 1 ? " perdida" : " perdidas"}
              </span>
              <span className="review-queue-page__stat">
                <GitPullRequestArrow className="size-3.5 text-[var(--brand-bright)]" aria-hidden />
                <strong>{okData.length}</strong>
                {okData.length === 1 ? " PR" : " PRs"}
              </span>
            </div>

            <div className="review-queue-page__filters" role="group" aria-label="Filtrar por status">
              {FILTER_OPTIONS.map((option) => {
                const count =
                  option === "all"
                    ? okData.length
                    : counts[option as MyReviewStatus];
                const isActive = filter === option;

                return (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "review-queue-page__filter",
                      !isActive && "review-queue-page__filter--idle"
                    )}
                    aria-pressed={isActive}
                    onClick={() => setFilter(option)}
                  >
                    {reviewQueueFilterLabel(option)}
                    <span className="review-queue-page__filter-count" aria-hidden>
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>

            {syncedAt ? (
              <p className="review-queue-page__synced">
                <CircleDashed className="size-3.5 shrink-0" aria-hidden />
                Sincronizado em {syncedAt}
              </p>
            ) : null}
          </div>
        ) : null}
      </Surface>

      {!hasData ? (
      <section className="alerts">
        {response?.status === "unauthenticated" && (
          <section className="alert">
            <h2>GitHub CLI sem autenticacao</h2>
            <p>
              Defina <code>GH_TOKEN</code> no <code>.env</code> ou execute <code>gh auth login</code> e tente
              novamente.
            </p>
            <div className="mt-8">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refresh()}
              >
                Tentar novamente
              </Button>
            </div>
          </section>
        )}

        {response?.status === "error" && (
          <section className="alert error">
            <h2>Falha na atualizacao</h2>
            <p>{response.message}</p>
            <div className="mt-8">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refresh()}
              >
                Tentar novamente
              </Button>
            </div>
          </section>
        )}
      </section>
      ) : null}

      {hasData && okData.length === 0 ? (
        <Surface variant="dashed" className="review-queue-page__empty p-8 text-center">
          <GitPullRequestArrow className="mx-auto size-10 text-[var(--brand-bright)]/80" aria-hidden />
          <h2 className="mt-4 text-base font-semibold text-[var(--app-text)]">Nada na fila</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--app-text-muted)]">
            Nenhuma PR aberta aguardando sua revisão. Quando alguém solicitar você como revisor, ela aparece
            aqui.
          </p>
        </Surface>
      ) : null}

      {hasData && okData.length > 0 && filtered.length === 0 ? (
        <Surface variant="dashed" className="review-queue-page__empty p-8 text-center">
          <p className="text-sm text-[var(--app-text-muted)]">
            Nenhuma PR corresponde ao filtro{" "}
            <strong className="text-[var(--app-text)]">{reviewQueueFilterLabel(filter)}</strong>.
          </p>
          <Button type="button" variant="ghost" size="sm" className="mt-4" onClick={() => setFilter("all")}>
            Ver todas
          </Button>
        </Surface>
      ) : null}

      {hasData && filtered.length > 0 ? (
        <ul className="review-queue-page__grid">
          {filtered.map((pr) => (
            <PrReviewerQueueItem key={pr.id} pr={pr} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
