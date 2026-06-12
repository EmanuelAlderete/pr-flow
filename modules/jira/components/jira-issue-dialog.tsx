"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FileText, LayoutTemplate, MessageSquareQuote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import type {
  JiraIssueCommentDto,
  JiraIssueDetailDto,
  JiraIssueTimeProgressDto
} from "@/modules/jira/lib/domain";
import { cn } from "@/lib/utils";

interface Props {
  issueKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCommentMeta(comment: JiraIssueCommentDto): string | null {
  const parts: string[] = [];
  if (comment.authorName) {
    parts.push(comment.authorName);
  }
  if (comment.created) {
    const date = new Date(comment.created);
    if (!Number.isNaN(date.getTime())) {
      parts.push(
        date.toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        })
      );
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function authorInitials(name: string | null | undefined): string {
  if (!name?.trim()) {
    return "?";
  }
  const chunks = name.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 1) {
    return chunks[0].slice(0, 2).toUpperCase();
  }
  return `${chunks[0].charAt(0)}${chunks[chunks.length - 1].charAt(0)}`.toUpperCase();
}

function figmaPathLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, "");
    if (!path) {
      return parsed.hostname;
    }
    return path.length > 48 ? `…${path.slice(-44)}` : path;
  } catch {
    return url;
  }
}

function SectionIcon({ name }: { name: "description" | "figma" | "comment" }) {
  const className = "size-3.5";

  if (name === "description") {
    return <FileText className={className} strokeWidth={2.2} aria-hidden />;
  }
  if (name === "figma") {
    return <LayoutTemplate className={className} strokeWidth={2.2} aria-hidden />;
  }
  return <MessageSquareQuote className={className} strokeWidth={2.2} aria-hidden />;
}

function DetailSection({
  icon,
  label,
  children,
  className
}: {
  icon: "description" | "figma" | "comment";
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("jira-task-dialog__section", className)}>
      <div className="jira-task-dialog__section-head">
        <span className="jira-task-dialog__section-icon" aria-hidden>
          <SectionIcon name={icon} />
        </span>
        <span>{label}</span>
      </div>
      {children}
    </section>
  );
}

function TimeProgressBar({ progress }: { progress: JiraIssueTimeProgressDto }) {
  const isOver = progress.percent > 100;
  const hasEstimate = progress.estimateSeconds > 0;
  const fillWidth = hasEstimate ? Math.min(100, progress.percent) : progress.spentSeconds > 0 ? 100 : 0;

  return (
    <div className="jira-task-dialog__progress" role="group" aria-label="Progresso de tempo">
      <div className="jira-task-dialog__progress-head">
        <span className="jira-task-dialog__progress-title">Tempo gasto vs. estimativa</span>
        {hasEstimate ? (
          <span
            className={cn(
              "jira-task-dialog__progress-percent",
              isOver && "jira-task-dialog__progress-percent--over"
            )}
          >
            {progress.percent}%
          </span>
        ) : null}
      </div>
      <div
        className="jira-task-dialog__progress-track"
        role="progressbar"
        aria-valuenow={progress.spentSeconds}
        aria-valuemin={0}
        aria-valuemax={hasEstimate ? progress.estimateSeconds : progress.spentSeconds}
        aria-label={`${progress.spentLabel} gastos de ${progress.estimateLabel} estimados`}
      >
        <div
          className={cn(
            "jira-task-dialog__progress-fill",
            isOver && "jira-task-dialog__progress-fill--over"
          )}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <div className="jira-task-dialog__progress-labels">
        <span>
          Gasto: <strong>{progress.spentLabel}</strong>
        </span>
        <span>
          Estimativa: <strong>{progress.estimateLabel}</strong>
        </span>
      </div>
      {progress.remainingLabel ? (
        <p className="m-0 text-xs text-[var(--app-text-muted)]">
          Restante: {progress.remainingLabel}
        </p>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="jira-task-dialog__body">
      <Skeleton className="h-[88px] w-full rounded-xl" />
      <div className="jira-task-dialog__skeleton-grid">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function JiraIssueDialog({ issueKey, open, onOpenChange }: Props) {
  const [detail, setDetail] = useState<JiraIssueDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setDetail(null);

      try {
        const response = await fetch(`/api/jira/issues/${encodeURIComponent(issueKey)}`);
        const body = (await response.json()) as JiraIssueDetailDto | { error?: string };

        if (!response.ok) {
          const message = "error" in body && body.error ? body.error : "Não foi possível carregar o ticket.";
          throw new Error(message);
        }

        if (!cancelled) {
          setDetail(body as JiraIssueDetailDto);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o ticket.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [issueKey, open]);

  const commentMeta = detail?.latestComment ? formatCommentMeta(detail.latestComment) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="jira-task-dialog max-w-none w-[min(46rem,calc(100vw-2rem))]"
        aria-describedby={undefined}
      >
        <div className="jira-task-dialog__shell panel">
          <header className="jira-task-dialog__header">
            <div className="min-w-0 flex-1">
              <p className="jira-task-dialog__key">
                <span className="jira-task-dialog__key-dot" aria-hidden />
                {issueKey}
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-[92%] rounded-md" />
              ) : (
                <DialogTitle className="jira-task-dialog__title">
                  {detail?.summary ?? "Carregando ticket…"}
                </DialogTitle>
              )}
            </div>

            {detail?.browseUrl ? (
              <a
                aria-label={`Abrir ${issueKey} no Jira`}
                className="jira-task-dialog__open-btn"
                href={detail.browseUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir no Jira
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </header>

          {error ? (
            <div className="jira-task-dialog__body">
              <p className="jira-task-dialog__error" role="alert">
                {error}
              </p>
            </div>
          ) : null}

          {isLoading ? <LoadingSkeleton /> : null}

          {!isLoading && detail ? (
            <div className="jira-task-dialog__body">
              {detail.timeProgress ? <TimeProgressBar progress={detail.timeProgress} /> : null}

              <div className="jira-task-dialog__columns">
                <div className="jira-task-dialog__column-main">
                  <DetailSection icon="description" label="Descrição">
                    <Surface variant="inset" className="min-h-[120px] min-w-0 overflow-hidden p-3.5">
                      {detail.description ? (
                        <p className="jira-task-dialog__prose">{detail.description}</p>
                      ) : (
                        <p className="jira-task-dialog__empty">Sem descrição neste ticket.</p>
                      )}
                    </Surface>
                  </DetailSection>
                </div>

                <div className="jira-task-dialog__column-side">
                  <DetailSection icon="figma" label="Figma">
                    {detail.figmaUrls.length > 0 ? (
                      <ul className="jira-task-dialog__figma-list">
                        {detail.figmaUrls.map((url) => (
                          <li key={url}>
                            <a
                              className="jira-task-dialog__figma-link"
                              href={url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <span className="jira-task-dialog__figma-mark" aria-hidden>
                                FIG
                              </span>
                              <span className="jira-task-dialog__figma-text">
                                <span className="jira-task-dialog__figma-label">Abrir protótipo</span>
                                <span className="jira-task-dialog__figma-path">{figmaPathLabel(url)}</span>
                              </span>
                              <ExternalLink className="ml-auto size-3.5 shrink-0 opacity-70" aria-hidden />
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="jira-task-dialog__empty">Nenhum link do Figma na descrição.</p>
                    )}
                  </DetailSection>

                  <DetailSection icon="comment" label="Último comentário">
                    {detail.latestComment ? (
                      <article className="jira-task-dialog__comment">
                        <span className="jira-task-dialog__avatar" aria-hidden>
                          {authorInitials(detail.latestComment.authorName)}
                        </span>
                        {commentMeta ? (
                          <p className="jira-task-dialog__comment-meta">{commentMeta}</p>
                        ) : (
                          <span className="jira-task-dialog__comment-meta">Comentário recente</span>
                        )}
                        <p className="jira-task-dialog__comment-body">{detail.latestComment.body}</p>
                      </article>
                    ) : (
                      <p className="jira-task-dialog__empty">Nenhum comentário publicado ainda.</p>
                    )}
                  </DetailSection>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
