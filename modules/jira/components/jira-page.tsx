"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LayoutGrid, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { StaleDataBanner } from "@/components/stale-data-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { JiraIssueCard } from "@/modules/jira/components/jira-issue-card";
import { useWorkContext } from "@/modules/work-context/components/work-context-provider";
import type { JiraIssuesResponse, JiraSprintDto, JiraSprintsResponse } from "@/modules/jira/lib/domain";
import { extractJiraIssueKey } from "@/modules/jira-issue-key";
import {
  resolveDefaultSprintFilter,
  type JiraSprintFilterValue
} from "@/modules/jira/lib/jira-sprint-filter";
export type { JiraSprintFilterValue };

function formatUpdated(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function sprintOptionLabel(sprint: JiraSprintDto): string {
  const dates = formatSprintDates(sprint);
  return dates ? `${sprint.name} (${dates})` : sprint.name;
}

function formatSprintDates(sprint: JiraSprintDto): string | null {
  if (!sprint.startDate && !sprint.endDate) {
    return null;
  }
  try {
    const start = sprint.startDate
      ? format(new Date(sprint.startDate), "d MMM", { locale: ptBR })
      : "?";
    const end = sprint.endDate ? format(new Date(sprint.endDate), "d MMM yyyy", { locale: ptBR }) : "?";
    return `${start} – ${end}`;
  } catch {
    return null;
  }
}

function JiraIssueCardSkeleton() {
  return (
    <Surface className="jira-issue-card jira-issue-card--skeleton p-4">
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="mt-3 h-5 w-full rounded-md" />
      <Skeleton className="mt-2 h-5 w-[88%] rounded-md" />
      <Skeleton className="mt-4 h-4 w-2/3 rounded-md" />
    </Surface>
  );
}

export function JiraPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<JiraIssuesResponse | null>(null);
  const [sprintsMeta, setSprintsMeta] = useState<JiraSprintsResponse | null>(null);
  const [sprintFilter, setSprintFilter] = useState<JiraSprintFilterValue>("all");
  const [sprintFilterReady, setSprintFilterReady] = useState(false);
  const sprintFilterInitializedRef = useRef(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sprintsError, setSprintsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSprints, setIsLoadingSprints] = useState(true);
  const { openWorkContext } = useWorkContext();

  const openIssueDetail = useCallback(
    (issueKey: string) => {
      openWorkContext(issueKey);
    },
    [openWorkContext]
  );

  const issueFromUrl = searchParams.get("issue");

  useEffect(() => {
    if (!issueFromUrl) {
      return;
    }
    const issueKey = extractJiraIssueKey(issueFromUrl);
    if (!issueKey) {
      return;
    }
    openIssueDetail(issueKey);
  }, [issueFromUrl, openIssueDetail]);

  const loadSprints = useCallback(async () => {
    setIsLoadingSprints(true);
    setSprintsError(null);

    try {
      const response = await fetch("/api/jira/sprints", { cache: "no-store" });
      const body = (await response.json()) as JiraSprintsResponse & { error?: string };

      if (response.status === 503) {
        setConfigError(body.error ?? "Integração com o Jira não configurada.");
        setSprintsMeta(null);
        return;
      }

      if (!response.ok) {
        throw new Error(body.error ?? "Falha ao carregar sprints.");
      }

      setSprintsMeta(body);
      if (!sprintFilterInitializedRef.current) {
        setSprintFilter(resolveDefaultSprintFilter(body.sprints));
        sprintFilterInitializedRef.current = true;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar as sprints do Jira.";
      setSprintsError(message);
      setSprintsMeta(null);
    } finally {
      setIsLoadingSprints(false);
      setSprintFilterReady(true);
    }
  }, []);

  const loadIssues = useCallback(async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams();
        if (sprintFilter !== "all") {
          params.set("sprint", sprintFilter);
        }
        const query = params.toString();
        const response = await fetch(`/api/jira/issues${query ? `?${query}` : ""}`, { cache: "no-store" });
        const body = (await response.json()) as JiraIssuesResponse & { error?: string };

        if (response.status === 503) {
          setConfigError(body.error ?? "Integração com o Jira não configurada.");
          setData(null);
          return;
        }

        if (!response.ok) {
          throw new Error(body.error ?? "Falha ao carregar tickets.");
        }

        setConfigError(null);
        setData(body);
        setLoadError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível carregar os tickets do Jira.";
        setLoadError(message);
        if (!data) {
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
  }, [sprintFilter]);

  useEffect(() => {
    void loadSprints();
  }, [loadSprints]);

  useEffect(() => {
    if (configError || !sprintFilterReady) {
      return;
    }
    void loadIssues();
  }, [loadIssues, configError, sprintFilterReady]);

  const subtitle = data?.displayName
    ? `${data.displayName} · ${data.email}`
    : data?.email ?? "Tickets atribuídos a você";

  const sprintFilterLabel = useMemo(() => {
    if (sprintFilter === "all") {
      return "todas as sprints";
    }
    if (sprintFilter === "open") {
      return "sprints abertas";
    }
    const sprint = sprintsMeta?.sprints.find((item) => String(item.id) === sprintFilter);
    return sprint ? sprint.name : "sprint selecionada";
  }, [sprintFilter, sprintsMeta?.sprints]);

  const sprintsByState = useMemo(() => {
    const groups: Record<JiraSprintDto["state"], JiraSprintDto[]> = {
      active: [],
      future: [],
      closed: []
    };
    for (const sprint of sprintsMeta?.sprints ?? []) {
      groups[sprint.state].push(sprint);
    }
    return groups;
  }, [sprintsMeta?.sprints]);

  const issueCount = data?.issues.length ?? 0;
  const staleMessage = data?.syncWarning ?? (loadError && data ? loadError : null);

  return (
    <section className="jira-page flex min-h-0 flex-1 flex-col gap-4" aria-label="Tickets do Jira">
      {staleMessage ? (
        <StaleDataBanner
          message={staleMessage}
          fetchedAt={data?.cachedAt}
          onRetry={() => void loadIssues()}
          isRetrying={isLoading}
          retryLabel="Atualizar"
        />
      ) : null}
      <Surface className="jira-page__toolbar panel overflow-hidden p-0">
        <div className="jira-page__toolbar-head">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="jira-page__eyebrow">
              <span className="jira-task-dialog__key-dot" aria-hidden />
              Atribuídos a você
            </p>
            <p className="jira-page__subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="jira-page__toolbar-body">
          <div className="jira-page__filters">
            <span id="jira-sprint-filter-label" className="jira-page__filter-label">
              Sprint
            </span>
            <Select
              value={sprintFilter}
              disabled={Boolean(configError) || isLoadingSprints}
              onValueChange={(value) => {
                if (value) {
                  setSprintFilter(value as JiraSprintFilterValue);
                }
              }}
            >
              <SelectTrigger
                id="jira-sprint-filter"
                className="jira-page__sprint-select min-w-[min(100%,300px)]"
                aria-labelledby="jira-sprint-filter-label"
                aria-label="Filtrar tickets por sprint"
              >
                <SelectValue placeholder="Selecione a sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sprints</SelectItem>
                <SelectItem value="open">Sprints abertas</SelectItem>
                {sprintsByState.active.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Ativas</SelectLabel>
                    {sprintsByState.active.map((sprint) => (
                      <SelectItem key={sprint.id} value={String(sprint.id)}>
                        {sprintOptionLabel(sprint)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {sprintsByState.future.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Futuras</SelectLabel>
                    {sprintsByState.future.map((sprint) => (
                      <SelectItem key={sprint.id} value={String(sprint.id)}>
                        {sprintOptionLabel(sprint)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {sprintsByState.closed.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Encerradas</SelectLabel>
                    {sprintsByState.closed.map((sprint) => (
                      <SelectItem key={sprint.id} value={String(sprint.id)}>
                        {sprintOptionLabel(sprint)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
            {sprintsMeta ? (
              <span className="jira-page__board-hint">
                Board {sprintsMeta.boardName} · {sprintsMeta.projectKey}
              </span>
            ) : null}
          </div>

          <div className="jira-page__stats" aria-label="Resumo da listagem">
            <span className="jira-page__stat">
              <Ticket className="size-3.5 text-[var(--brand-bright)]" aria-hidden />
              <strong>{isLoading ? "—" : issueCount}</strong>
              {issueCount === 1 ? " ticket" : " tickets"}
            </span>
            <span className="jira-page__stat">
              <LayoutGrid className="size-3.5 text-[var(--app-text-muted)]" aria-hidden />
              {sprintFilterLabel}
            </span>
          </div>
        </div>

        {sprintsError ? <p className="jira-page__inline-error">{sprintsError}</p> : null}
      </Surface>

      {configError ? (
        <Surface variant="dashed" className="p-6 text-center text-sm text-[var(--app-text-muted)]">
          <p>{configError}</p>
          <p className="mt-2">
            Defina <code className="text-[var(--brand)]">JIRA_EMAIL</code> e{" "}
            <code className="text-[var(--brand)]">JIRA_TOKEN</code> no arquivo <code>.env</code> e reinicie o
            servidor.
          </p>
        </Surface>
      ) : null}

      {!configError && isLoading ? (
        <ul className="jira-page__grid" aria-busy="true" aria-label="Carregando tickets">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <JiraIssueCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {!configError && !isLoading && loadError && !data ? (
        <Surface variant="dashed" className="p-6 text-center text-sm text-destructive">
          {loadError}
        </Surface>
      ) : null}

      {!configError && !isLoading && !loadError && !staleMessage && data?.issues.length === 0 ? (
        <Surface variant="dashed" className="jira-page__empty p-8 text-center text-sm text-[var(--app-text-muted)]">
          <p className="jira-page__eyebrow jira-page__eyebrow--center">
            <span className="jira-task-dialog__key-dot" aria-hidden />
            Nenhum ticket
          </p>
          <p className="mt-2">Nenhum ticket em aberto atribuído a você para {sprintFilterLabel}.</p>
        </Surface>
      ) : null}

      {!configError && !isLoading && data && data.issues.length > 0 ? (
        <ul className="jira-page__grid" role="list">
          {data.issues.map((issue) => (
            <li key={issue.key}>
              <JiraIssueCard
                issue={issue}
                updatedLabel={formatUpdated(issue.updated)}
                onOpenDetail={() => openIssueDetail(issue.key)}
              />
            </li>
          ))}
        </ul>
      ) : null}

    </section>
  );
}
