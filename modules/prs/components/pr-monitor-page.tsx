"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { StaleDataBanner } from "@/components/stale-data-banner";
import { Button } from "@/components/ui/button";
import { isPrMonitorWithData } from "@/modules/app/lib/sync-data-helpers";
import { usePendingReviewCount } from "@/modules/notifications/hooks/use-pending-review-count";
import { summarizePrMonitorChanges } from "@/modules/notifications/lib/pr-alert-events";
import { PrCard } from "@/modules/prs/components/pr-card";
import { PrInsightsPanel } from "@/modules/prs/components/pr-insights-panel";
import { PrSearchBar } from "@/modules/prs/components/pr-search-bar";
import type { MonitoredPr } from "@/modules/prs/lib/domain";
import { filterPrsBySearch } from "@/modules/prs/lib/pr-search";
import { buildPrInsights } from "@/modules/prs/lib/pr-metrics";
import { usePrMonitorSync } from "@/modules/prs/hooks/use-pr-monitor-sync";
import { loadPrMonitorLastSync } from "@/modules/prs/lib/pr-monitor-cache";
import { cn } from "@/lib/utils";

interface Props {
  slackConfigured?: boolean;
}

export function PrMonitorPage({ slackConfigured = false }: Props) {
  const { response, loading, isFetching, refresh } = usePrMonitorSync();
  const pendingReviewCount = usePendingReviewCount();
  const [changeAlert, setChangeAlert] = useState<string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const lastOkDataRef = useRef<MonitoredPr[] | null>(null);

  useEffect(() => {
    const cached = loadPrMonitorLastSync();
    lastOkDataRef.current = cached?.data ?? null;
  }, []);

  useEffect(() => {
    if (response?.status !== "ok") {
      return;
    }
    const previous = lastOkDataRef.current;
    if (previous !== null) {
      const changes = summarizePrMonitorChanges(previous, response.data);
      if (changes.length > 0) {
        setChangeAlert(changes);
      }
    }
    lastOkDataRef.current = response.data;
  }, [response]);

  const hasData = isPrMonitorWithData(response);
  const okData = hasData ? response.data : [];
  const filteredPrs = filterPrsBySearch(okData, searchQuery);
  const insights = buildPrInsights({
    openPrs: okData,
    pendingReviewCount
  });

  if (loading && response === null) {
    return (
      <section className="panel">
        <p className="small muted">Carregando monitor...</p>
      </section>
    );
  }

  return (
    <div aria-busy={isFetching}>
      {response?.status === "stale" ? (
        <StaleDataBanner
          message={response.message}
          fetchedAt={response.fetchedAt}
          onRetry={() => void refresh()}
          isRetrying={isFetching}
        />
      ) : null}

      {changeAlert !== null && (
        <section className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="change-alert-title">
          <section className="modal-panel panel">
            <h2 id="change-alert-title">Mudancas detectadas na sincronizacao</h2>
            <p className="muted small">Resumo das alteracoes encontradas no ultimo ciclo:</p>
            <ul className="modal-list">
              {changeAlert.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button className="button" onClick={() => setChangeAlert(null)} type="button">
              Fechar alerta
            </button>
          </section>
        </section>
      )}

      {!hasData ? (
        <section className="alerts">
          {response?.status === "unauthenticated" && (
            <section className="alert">
              <h2>GitHub CLI sem autenticacao</h2>
              <p>
                Defina <code>GH_TOKEN</code> no <code>.env</code> (recomendado no Docker) ou execute{" "}
                <code>gh auth login</code> no terminal e tente novamente.
              </p>
              <div className="mt-8">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  onClick={() => void refresh()}
                >
                  {isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {isFetching ? "Sincronizando…" : "Tentar novamente"}
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
                  {isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {isFetching ? "Sincronizando…" : "Tentar novamente"}
                </Button>
              </div>
            </section>
          )}
        </section>
      ) : null}

      {hasData ? (
        <section className="list-section">
          <PrInsightsPanel insights={insights} />

          <section className="panel status-row flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => void refresh()}
              aria-label={isFetching ? "Sincronizando monitor de PRs" : "Atualizar monitor de PRs"}
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              {isFetching ? "Sincronizando…" : "Atualizar"}
            </Button>
            <PrSearchBar onDebouncedChange={setSearchQuery} />
          </section>

          <section
            className={cn(
              "cards-grid transition-opacity duration-200",
              isFetching && "pointer-events-none opacity-60"
            )}
          >
            {okData.length === 0 ? (
              <section className="panel pr-card">
                <p className="small muted">Nenhuma PR aberta encontrada.</p>
              </section>
            ) : filteredPrs.length === 0 ? (
              <section className="panel pr-card">
                <p className="small muted">Nenhuma PR corresponde a busca.</p>
              </section>
            ) : (
              filteredPrs.map((pr) => (
                <PrCard key={pr.id} allOpenPrs={okData} pr={pr} slackConfigured={slackConfigured} />
              ))
            )}
          </section>
        </section>
      ) : null}
    </div>
  );
}
