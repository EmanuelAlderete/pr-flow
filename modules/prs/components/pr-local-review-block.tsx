"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";
import { localReviewPath } from "@/modules/prs/lib/local-review/local-review-markdown";
import { ptBR } from "@/modules/messages";

export function PrLocalReviewBlock({
  review,
  repository,
  prNumber
}: {
  review?: PrLocalReviewInfo | null;
  repository: string;
  prNumber: number;
}) {
  const elapsed = useElapsedLabel(review?.status === "running" ? review.startedAt : null);

  if (!review) {
    return null;
  }

  if (review.status === "running") {
    const started = formatClock(review.startedAt);
    return (
      <div className="pr-local-review" role="status" aria-live="polite">
        <p className="small flex items-center gap-1.5 text-[var(--app-text)]">
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          {ptBR.localReview.running}
        </p>
        {started && elapsed ? (
          <p className="small muted">{ptBR.localReview.runningDetail(started, elapsed)}</p>
        ) : null}
      </div>
    );
  }

  if (review.status === "error") {
    return (
      <p className="small muted pr-local-review" role="status">
        {ptBR.localReview.failed}
        {review.error ? ` — ${review.error}` : ""}
      </p>
    );
  }

  const href = localReviewPath(repository, prNumber);
  const label = ptBR.localReview.summary(review.findings.length);

  return (
    <div className="pr-local-review">
      {href ? (
        <Link href={href} className="small text-[var(--app-link)] underline-offset-2 hover:underline">
          {label}
        </Link>
      ) : (
        <p className="small">{label}</p>
      )}
      {review.summary ? <p className="small mt-1 line-clamp-2">{review.summary}</p> : null}
      <p className="small muted">{ptBR.localReview.human}</p>
    </div>
  );
}

export function PrLocalReviewRunningBanner({
  repository,
  prNumber,
  startedAt
}: {
  repository: string;
  prNumber: number;
  startedAt?: string | null;
}) {
  const elapsed = useElapsedLabel(startedAt);
  const started = formatClock(startedAt);
  const repo = repository.slice(repository.lastIndexOf("/") + 1);

  return (
    <p className="review-queue-page__synced text-[var(--app-text)]" role="status" aria-live="polite">
      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      <span>
        {ptBR.localReview.queueRunning(repo, prNumber)}
        {started && elapsed ? ` · ${ptBR.localReview.runningDetail(started, elapsed)}` : null}
      </span>
    </p>
  );
}

function useElapsedLabel(startedAt: string | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!startedAt) {
    return null;
  }

  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) {
    return null;
  }

  return formatElapsed(Math.max(0, now - startedMs));
}

function formatClock(startedAt: string | null | undefined): string | null {
  if (!startedAt) {
    return null;
  }
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} h ${minutes % 60} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
  }
  return `${seconds} s`;
}
