"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckSquare,
  ExternalLink,
  GitPullRequest,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import type { WorkContext, WorkContextGap } from "@/modules/work-context/lib/domain";
import { getJiraBrowseUrl } from "@/modules/jira-issue-key";
import { jiraStatusPillClass } from "@/modules/jira/lib/jira-issue-status";
import { cn } from "@/lib/utils";
import { JiraBranchContextMenu } from "@/modules/jira-branch/components/jira-branch-context-menu";

type Props = {
  issueKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function prStatusLabel(statusGeral: string): string {
  switch (statusGeral) {
    case "approved":
      return "Aprovada";
    case "changes_requested":
      return "Alterações pedidas";
    case "pending_review":
      return "Review pendente";
    case "no_reviewers":
      return "Sem reviewers";
    default:
      return statusGeral;
  }
}

function GapAlert({ gap }: { gap: WorkContextGap }) {
  const Icon = gap.severity === "warning" ? AlertTriangle : Info;
  return (
    <Surface
      variant="inset"
      className={cn(
        "work-context-gap flex gap-3 p-3 text-sm",
        gap.severity === "warning" ? "border-amber-500/35" : "border-[var(--app-border-strong)]"
      )}
      role="status"
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          gap.severity === "warning" ? "text-amber-400" : "text-[var(--app-text-muted)]"
        )}
        aria-hidden
      />
      <p className="text-[var(--app-text-soft)]">{gap.message}</p>
    </Surface>
  );
}

function SectionHeading({
  icon: Icon,
  label,
  count
}: {
  icon: typeof GitPullRequest;
  label: string;
  count: number;
}) {
  return (
    <h3 className="work-context-section__title">
      <Icon className="size-4 text-[var(--brand)]" aria-hidden />
      {label}
      <span className="work-context-section__count">{count}</span>
    </h3>
  );
}

export function WorkContextDialog({ issueKey, open, onOpenChange }: Props) {
  const [context, setContext] = useState<WorkContext | null>(null);
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
      setContext(null);

      try {
        const response = await fetch(`/api/work-context/${encodeURIComponent(issueKey)}`);
        const body = (await response.json()) as WorkContext | { error?: string };

        if (!response.ok) {
          const message = "error" in body && body.error ? body.error : "Não foi possível carregar o contexto.";
          throw new Error(message);
        }

        if (!cancelled) {
          setContext(body as WorkContext);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o contexto.");
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

  const summary = context?.jira.summary;
  const browseUrl = context?.jira.detail?.browseUrl ?? (summary ? getJiraBrowseUrl(issueKey) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="work-context-dialog jira-task-dialog max-w-none w-[min(52rem,calc(100vw-2rem))]"
        aria-describedby={undefined}
      >
        <JiraBranchContextMenu
          issueKey={issueKey}
          issueTypeName={summary?.issueTypeName}
          summary={summary?.summary ?? context?.jira.detail?.summary}
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
                  {summary?.summary ?? context?.jira.detail?.summary ?? "Contexto de trabalho"}
                </DialogTitle>
              )}
              {summary ? (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                  <span
                    className={cn(
                      "jira-issue-card__status rounded-full px-2 py-0.5",
                      jiraStatusPillClass(summary.statusCategoryKey)
                    )}
                  >
                    {summary.statusName}
                  </span>
                  <span>{summary.issueTypeName}</span>
                </p>
              ) : null}
            </div>

            {browseUrl ? (
              <a
                aria-label={`Abrir ${issueKey} no Jira`}
                className="jira-task-dialog__open-btn"
                href={browseUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir no Jira
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </header>

          <div className="jira-task-dialog__body space-y-5">
            {error ? (
              <p className="jira-task-dialog__error" role="alert">
                {error}
              </p>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : null}

            {!isLoading && context ? (
              <>
                {context.gaps.length > 0 ? (
                  <section aria-label="Alertas de lacuna" className="space-y-2">
                    {context.gaps.map((gap) => (
                      <GapAlert key={gap.kind} gap={gap} />
                    ))}
                  </section>
                ) : null}

                <section aria-labelledby="work-context-prs">
                  <SectionHeading icon={GitPullRequest} label="Pull requests" count={context.pullRequests.length} />
                  {context.pullRequests.length === 0 ? (
                    <p className="work-context-empty">Nenhuma PR aberta com esta chave no título.</p>
                  ) : (
                    <ul className="work-context-list" role="list">
                      {context.pullRequests.map((pr) => (
                        <li key={`${pr.repository}#${pr.number}`}>
                          <a
                            className="work-context-list__item"
                            href={pr.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span className="work-context-list__primary">
                              #{pr.number} {pr.title}
                            </span>
                            <span className="work-context-list__meta">
                              {pr.repository} · {prStatusLabel(pr.statusGeral)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="work-context-tasks">
                  <SectionHeading icon={CheckSquare} label="Tasks locais" count={context.tasks.length} />
                  {context.tasks.length === 0 ? (
                    <p className="work-context-empty">Nenhuma task menciona esta chave.</p>
                  ) : (
                    <ul className="work-context-list" role="list">
                      {context.tasks.map((task) => (
                        <li key={task.id}>
                          <Link className="work-context-list__item" href="/tasks">
                            <span className="work-context-list__primary">{task.title}</span>
                            <span className="work-context-list__meta">
                              {task.completed ? "Concluída" : "Em aberto"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="work-context-journal">
                  <SectionHeading icon={BookOpen} label="Journal" count={context.journalMentions.length} />
                  {context.journalMentions.length === 0 ? (
                    <p className="work-context-empty">Nenhuma menção no journal.</p>
                  ) : (
                    <ul className="work-context-list" role="list">
                      {context.journalMentions.map((mention) => (
                        <li key={mention.notebookDay}>
                          <Link
                            className="work-context-list__item"
                            href={`/journal?day=${mention.notebookDay}`}
                          >
                            <span className="work-context-list__primary">{mention.notebookDay}</span>
                            <span className="work-context-list__meta">{mention.excerpt}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {!summary && !context.jira.detail ? (
                  <p className="work-context-empty">
                    Ticket ainda não está no cache do Jira. PRs, tasks e journal acima foram correlacionados
                    pelo texto.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
          </div>
        </JiraBranchContextMenu>
      </DialogContent>
    </Dialog>
  );
}
