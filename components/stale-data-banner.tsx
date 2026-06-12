"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type StaleDataBannerProps = {
  message: string;
  fetchedAt?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
};

function formatFetchedAt(iso: string): string | null {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ptBR });
  } catch {
    return null;
  }
}

export function StaleDataBanner({
  message,
  fetchedAt,
  onRetry,
  isRetrying = false,
  retryLabel = "Tentar novamente"
}: StaleDataBannerProps) {
  const fetchedLabel = fetchedAt ? formatFetchedAt(fetchedAt) : null;

  return (
    <div className="stale-data-banner" role="alert" aria-live="polite">
      <TriangleAlert className="stale-data-banner__icon size-4 shrink-0" aria-hidden />
      <div className="stale-data-banner__content">
        <p className="stale-data-banner__title">Não foi possível atualizar os dados</p>
        <p className="stale-data-banner__message">
          {fetchedLabel
            ? `Exibindo a última versão salva (${fetchedLabel}). ${message}`
            : message}
        </p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="stale-data-banner__action shrink-0"
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
