"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, CheckSquare, FileText, GitPullRequest, Ticket } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyDashboardHubStats,
  fetchDashboardHubStats,
  type DashboardHubStats
} from "@/modules/dashboard/lib/dashboard-hub-stats";
import {
  loadDashboardHubStatsCache,
  saveDashboardHubStatsCache
} from "@/modules/dashboard/lib/dashboard-widget-cache";

const hubLinks = [
  {
    href: "/prs",
    title: "Pull Requests",
    description: "Reviewers e status das PRs abertas",
    icon: GitPullRequest,
    statId: "prs"
  },
  {
    href: "/tasks",
    title: "Tarefas",
    description: "Lista pessoal de trabalho",
    icon: CheckSquare,
    statId: "tasks"
  },
  {
    href: "/jira",
    title: "Jira",
    description: "Tickets atribuídos a você na sprint atual",
    icon: Ticket,
    statId: "jira"
  },
  {
    href: "/summaries",
    title: "Resumos",
    description: "Histórico diário e semanal com IA",
    icon: FileText,
    statId: "summaries"
  }
] as const;

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

type HubStatContent =
  | {
      kind: "count";
      value: number;
      unit: string;
      ariaLabel: string;
      detail?: ReactNode;
    }
  | { kind: "text"; text: string; ariaLabel: string }
  | { kind: "unavailable" };

function buildHubStat(item: (typeof hubLinks)[number], stats: DashboardHubStats): HubStatContent {
  if (item.statId === "summaries") {
    return { kind: "text", text: "Ver histórico", ariaLabel: "Ver histórico de resumos" };
  }

  if (item.statId === "prs") {
    if (stats.openPrs === null) {
      return { kind: "unavailable" };
    }

    const unit = pluralize(stats.openPrs, "aberta", "abertas");
    const pending = stats.pendingReviews ?? 0;
    const ariaLabel =
      pending > 0
        ? `${stats.openPrs} ${unit}, ${pending} para revisar`
        : `${stats.openPrs} ${unit}`;

    return {
      kind: "count",
      value: stats.openPrs,
      unit,
      ariaLabel,
      detail:
        pending > 0 ? (
          <Link
            href="/prs/reviews"
            className="text-sm font-medium text-[var(--app-accent)] underline-offset-2 hover:underline"
          >
            {pending} para revisar
          </Link>
        ) : undefined
    };
  }

  if (item.statId === "tasks") {
    if (stats.openTasks === null) {
      return { kind: "unavailable" };
    }

    const overdue = stats.overdueTasks ?? 0;
    const ariaLabel =
      overdue > 0
        ? `${stats.openTasks} em aberto, ${overdue} ${pluralize(overdue, "atrasada", "atrasadas")}`
        : `${stats.openTasks} em aberto`;

    return {
      kind: "count",
      value: stats.openTasks,
      unit: "em aberto",
      ariaLabel,
      detail:
        overdue > 0 ? (
          <span className="text-sm text-[var(--app-accent)]">
            {overdue} {pluralize(overdue, "atrasada", "atrasadas")}
          </span>
        ) : undefined
    };
  }

  if (item.statId === "jira") {
    if (stats.jiraSprintTickets === null) {
      return { kind: "unavailable" };
    }

    if (stats.jiraSprintTickets === 0) {
      const ariaLabel = stats.jiraSprintLabel
        ? `Nenhum ticket na sprint ${stats.jiraSprintLabel}`
        : "Nenhum ticket na sprint";
      return {
        kind: "count",
        value: 0,
        unit: "na sprint",
        ariaLabel,
        detail: stats.jiraSprintLabel ? (
          <span className="text-sm text-[var(--app-text-muted)]">{stats.jiraSprintLabel}</span>
        ) : (
          <span className="text-sm text-[var(--app-text-muted)]">Nenhum ticket</span>
        )
      };
    }

    const unit = pluralize(stats.jiraSprintTickets, "ticket na sprint", "tickets na sprint");
    const ariaLabel = stats.jiraSprintLabel
      ? `${stats.jiraSprintTickets} ${unit}, ${stats.jiraSprintLabel}`
      : `${stats.jiraSprintTickets} ${unit}`;

    return {
      kind: "count",
      value: stats.jiraSprintTickets,
      unit,
      ariaLabel,
      detail: stats.jiraSprintLabel ? (
        <span className="text-sm text-[var(--app-text-muted)]">{stats.jiraSprintLabel}</span>
      ) : undefined
    };
  }

  return { kind: "unavailable" };
}

function HubCardHeader({ item }: { item: (typeof hubLinks)[number] }) {
  const Icon = item.icon;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
          <Icon className="size-4" aria-hidden />
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-[var(--app-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--app-text)]">{item.title}</h3>
        <p className="text-xs leading-relaxed text-[var(--app-text-muted)]">{item.description}</p>
      </div>
    </>
  );
}

function HubCardStat({
  item,
  stats,
  isLoading
}: {
  item: (typeof hubLinks)[number];
  stats: DashboardHubStats;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2" data-testid={`hub-stat-${item.statId}`}>
        <Skeleton className="h-9 w-14" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    );
  }

  const stat = buildHubStat(item, stats);

  if (stat.kind === "unavailable") {
    return (
      <p
        className="text-sm text-[var(--app-text-muted)]"
        data-testid={`hub-stat-${item.statId}`}
      >
        Indisponível
      </p>
    );
  }

  if (stat.kind === "text") {
    return (
      <p
        className="text-base font-medium text-[var(--app-accent)]"
        data-testid={`hub-stat-${item.statId}`}
        aria-label={stat.ariaLabel}
      >
        {stat.text}
      </p>
    );
  }

  return (
    <div
      className="space-y-1"
      role="status"
      aria-label={stat.ariaLabel}
      data-testid={`hub-stat-${item.statId}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums leading-none tracking-tight text-[var(--app-text)] sm:text-4xl">
          {stat.value}
        </span>
        <span className="pb-0.5 text-sm font-medium text-[var(--app-accent)]">{stat.unit}</span>
      </div>
      {stat.detail ? <div className="pt-0.5">{stat.detail}</div> : null}
    </div>
  );
}

export function DashboardHub() {
  const [stats, setStats] = useState<DashboardHubStats>(emptyDashboardHubStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = loadDashboardHubStatsCache();
    if (cached) {
      setStats(cached);
      setIsLoading(false);
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const next = await fetchDashboardHubStats(controller.signal);
        if (!controller.signal.aborted) {
          setStats(next);
          saveDashboardHubStatsCache(next);
        }
      } catch {
        if (!controller.signal.aborted && !cached) {
          setStats(emptyDashboardHubStats);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <section aria-label="Atalhos dos módulos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {hubLinks.map((item) => {
        const pendingReviews = stats.pendingReviews ?? 0;
        const showReviewLink = item.statId === "prs" && !isLoading && pendingReviews > 0;

        if (showReviewLink) {
          return (
            <Surface
              key={item.href}
              className="group flex h-full flex-col gap-4 p-4 transition-[filter,transform] duration-200 hover:brightness-[1.03] hover:-translate-y-px"
            >
              <Link
                href={item.href}
                className="flex flex-col gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md"
              >
                <HubCardHeader item={item} />
              </Link>
              <HubCardStat item={item} stats={stats} isLoading={isLoading} />
            </Surface>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group block rounded-[14px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Surface className="flex h-full flex-col gap-4 p-4 transition-[filter,transform] duration-200 group-hover:brightness-[1.03] group-hover:-translate-y-px">
              <HubCardHeader item={item} />
              <HubCardStat item={item} stats={stats} isLoading={isLoading} />
            </Surface>
          </Link>
        );
      })}
    </section>
  );
}
