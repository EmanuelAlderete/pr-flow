"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { validateBranchSlug } from "@/modules/jira-branch/lib/jira-branch-slug";
import { resolveBranchPrefixFromIssueType } from "@/modules/jira-branch/lib/jira-branch-prefix";
import type { JiraBranchCreateItemResult } from "@/modules/jira-branch/lib/jira-branch-service";
import { cn } from "@/lib/utils";

type RepositoryItem = { repository: string; defaultBranch: string };

type RepoBaseState = {
  defaultBranch: string;
  baseBranch: string;
  options: string[];
  loading: boolean;
  error: string | null;
};

type ExistsCheck = {
  repository: string;
  exists: boolean;
};

const STEPS = [
  { id: "repos", label: "Repositórios" },
  { id: "name", label: "Nome" },
  { id: "base", label: "Base e criar" }
] as const;

type Props = {
  issueKey: string;
  issueTypeName?: string;
  summary?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JiraBranchWizardDialog({
  issueKey,
  issueTypeName = "Task",
  summary,
  open,
  onOpenChange
}: Props) {
  const [step, setStep] = useState(0);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  const [prefix, setPrefix] = useState<"feat" | "fix">(
    resolveBranchPrefixFromIssueType(issueTypeName)
  );
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const suggestGenerationRef = useRef(0);

  const [existsChecks, setExistsChecks] = useState<ExistsCheck[]>([]);
  const [branchNamePreview, setBranchNamePreview] = useState("");

  const [repoBaseState, setRepoBaseState] = useState<Record<string, RepoBaseState>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createResults, setCreateResults] = useState<JiraBranchCreateItemResult[] | null>(null);
  const [createdBranchName, setCreatedBranchName] = useState<string | null>(null);

  const keySegment = issueKey.trim().toLowerCase();
  const fullBranchName = `${prefix}/${keySegment}/${slug.trim()}`;

  const resetWizard = useCallback(() => {
    setStep(0);
    setSelectedRepos([]);
    setPrefix(resolveBranchPrefixFromIssueType(issueTypeName));
    setSlug("");
    setSlugError(null);
    setAiAvailable(true);
    setSuggestLoading(false);
    setSuggestError(null);
    setExistsChecks([]);
    setBranchNamePreview("");
    setRepoBaseState({});
    setIsCreating(false);
    setCreateResults(null);
    setCreatedBranchName(null);
  }, [issueTypeName]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetWizard();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetWizard]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    setRepositoriesLoading(true);
    setRepositoriesError(null);

    fetch("/api/prs/open/repositories", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Falha ao carregar repositórios.");
        }
        return response.json() as Promise<{ repositories: RepositoryItem[] }>;
      })
      .then((payload) => {
        setRepositories(payload.repositories);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Falha ao carregar repositórios.";
        setRepositoriesError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRepositoriesLoading(false);
        }
      });

    fetch(`/api/work-context/${encodeURIComponent(issueKey)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{
          pullRequests?: Array<{ repository: string }>;
        }>;
      })
      .then((context) => {
        if (!context?.pullRequests?.length) {
          return;
        }
        const fromPrs = [...new Set(context.pullRequests.map((pr) => pr.repository))];
        if (fromPrs.length > 0) {
          setSelectedRepos(fromPrs);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [open, issueKey]);

  const runSuggest = useCallback(async () => {
    const generation = suggestGenerationRef.current + 1;
    suggestGenerationRef.current = generation;
    setSuggestLoading(true);
    setSuggestError(null);

    try {
      const response = await fetch(
        `/api/jira/issues/${encodeURIComponent(issueKey)}/branches/suggest`,
        { method: "POST" }
      );
      const payload = (await response.json()) as {
        prefix?: "feat" | "fix";
        slug?: string;
        branchName?: string;
        aiAvailable?: boolean;
        error?: string;
      };

      if (suggestGenerationRef.current !== generation) {
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao gerar nome da branch.");
      }

      if (payload.prefix) {
        setPrefix(payload.prefix);
      }
      setAiAvailable(payload.aiAvailable ?? true);
      if (payload.slug) {
        setSlug(payload.slug);
        setSlugError(null);
      }
      if (payload.branchName) {
        setBranchNamePreview(payload.branchName);
      }
    } catch (error) {
      if (suggestGenerationRef.current !== generation) {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Falha ao gerar nome da branch.";
      setSuggestError(message);
    } finally {
      if (suggestGenerationRef.current === generation) {
        setSuggestLoading(false);
      }
    }
  }, [issueKey]);

  useEffect(() => {
    if (!open || step !== 1) {
      return;
    }
    void runSuggest();
  }, [open, step, runSuggest]);

  const loadBaseBranchesForRepo = useCallback(async (repository: string, signal?: AbortSignal) => {
    setRepoBaseState((current) => ({
      ...current,
      [repository]: {
        defaultBranch: current[repository]?.defaultBranch ?? "",
        baseBranch: current[repository]?.baseBranch ?? "",
        options: current[repository]?.options ?? [],
        loading: true,
        error: null
      }
    }));

    try {
      const response = await fetch(
        `/api/prs/open/base-branches?repository=${encodeURIComponent(repository)}`,
        { signal }
      );
      const payload = (await response.json()) as {
        defaultBranch?: string;
        baseBranches?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao carregar branches destino.");
      }

      if (signal?.aborted) {
        return;
      }

      const defaultBranch = payload.defaultBranch ?? "";
      const options = payload.baseBranches ?? [];

      setRepoBaseState((current) => ({
        ...current,
        [repository]: {
          defaultBranch,
          baseBranch: defaultBranch,
          options,
          loading: false,
          error: null
        }
      }));
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Falha ao carregar branches destino.";
      setRepoBaseState((current) => ({
        ...current,
        [repository]: {
          defaultBranch: current[repository]?.defaultBranch ?? "",
          baseBranch: current[repository]?.baseBranch ?? "",
          options: current[repository]?.options ?? [],
          loading: false,
          error: message
        }
      }));
    }
  }, []);

  useEffect(() => {
    if (!open || step !== 2 || selectedRepos.length === 0) {
      return;
    }

    const controller = new AbortController();

    for (const repository of selectedRepos) {
      void loadBaseBranchesForRepo(repository, controller.signal);
    }

    return () => controller.abort();
  }, [open, step, selectedRepos, loadBaseBranchesForRepo]);

  const toggleRepo = (repository: string, checked: boolean) => {
    setSelectedRepos((current) => {
      if (checked) {
        return current.includes(repository) ? current : [...current, repository];
      }
      return current.filter((item) => item !== repository);
    });
  };

  const validateSlugField = (): boolean => {
    const error = validateBranchSlug(slug);
    setSlugError(error);
    return error === null;
  };

  const runExistsCheck = async (): Promise<boolean> => {
    const response = await fetch(
      `/api/jira/issues/${encodeURIComponent(issueKey)}/branches/check`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositories: selectedRepos, slug: slug.trim() })
      }
    );

    const payload = (await response.json()) as {
      branchName?: string;
      checks?: ExistsCheck[];
      error?: string;
      errors?: Record<string, string>;
    };

    if (!response.ok) {
      if (payload.errors) {
        const first = Object.values(payload.errors)[0];
        toast.error(first ?? "Dados inválidos.");
        return false;
      }
      toast.error(payload.error ?? "Falha ao verificar branches.");
      return false;
    }

    setBranchNamePreview(payload.branchName ?? fullBranchName);
    setExistsChecks(payload.checks ?? []);
    return true;
  };

  const handleNext = async () => {
    if (step === 0) {
      if (selectedRepos.length === 0) {
        toast.error("Selecione ao menos um repositório.");
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!validateSlugField()) {
        return;
      }
      const ok = await runExistsCheck();
      if (ok) {
        setStep(2);
      }
    }
  };

  const handleCreate = async () => {
    if (!validateSlugField()) {
      return;
    }

    setIsCreating(true);

    try {
      const targets = selectedRepos.map((repository) => ({
        repository,
        baseBranch: repoBaseState[repository]?.baseBranch ?? repositories.find((r) => r.repository === repository)?.defaultBranch ?? "main"
      }));

      const response = await fetch(
        `/api/jira/issues/${encodeURIComponent(issueKey)}/branches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: slug.trim(), targets })
        }
      );

      const payload = (await response.json()) as {
        branchName?: string;
        results?: JiraBranchCreateItemResult[];
        createdCount?: number;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        if (payload.errors) {
          const first = Object.values(payload.errors)[0];
          toast.error(first ?? "Dados inválidos.");
          return;
        }
        toast.error(payload.error ?? "Falha ao criar branches.");
        return;
      }

      setCreatedBranchName(payload.branchName ?? fullBranchName);
      setCreateResults(payload.results ?? []);

      const createdCount = payload.createdCount ?? 0;
      if (createdCount > 0) {
        toast.success(
          createdCount === 1
            ? "Branch criada no GitHub."
            : `Branch criada em ${createdCount} repositório(s).`
        );
      } else {
        toast.warning("Nenhuma branch nova foi criada.");
      }
    } catch {
      toast.error("Falha ao criar branches.");
    } finally {
      setIsCreating(false);
    }
  };

  const existsWarningRepos = useMemo(
    () => existsChecks.filter((check) => check.exists).map((check) => check.repository),
    [existsChecks]
  );

  const dialogTitle = summary
    ? `Criar branch — ${issueKey}`
    : `Criar branch — ${issueKey}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="jira-branch-wizard max-w-none w-[min(40rem,calc(100vw-2rem))]"
        aria-describedby={undefined}
      >
        {createResults ? (
          <div className="space-y-4 p-1">
            <div className="text-center">
              <Check className="mx-auto size-10 text-[var(--brand-bright)]" aria-hidden />
              <DialogTitle className="mt-3 text-lg font-semibold text-[var(--app-text)]">
                Branch {createdBranchName}
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Refs remotas no GitHub. Faça checkout local e commite no seu IDE.
              </p>
            </div>

            <ul className="space-y-2" role="list">
              {createResults.map((result) => (
                <li key={result.repository}>
                  <Surface variant="inset" className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-[var(--app-text)]">{result.repository}</p>
                      <p className="text-[var(--app-text-muted)]">
                        {result.status === "created"
                          ? "Criada"
                          : result.status === "skipped"
                            ? result.message ?? "Já existia"
                            : result.message ?? "Erro"}
                      </p>
                    </div>
                    {result.openPrUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={result.openPrUrl} />}
                      >
                        Abrir PR
                      </Button>
                    ) : null}
                  </Surface>
                </li>
              ))}
            </ul>

            <div className="flex justify-end">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="jira-branch-wizard__body space-y-5 p-1">
            <div>
              <DialogTitle className="text-lg font-semibold text-[var(--app-text)]">
                {dialogTitle}
              </DialogTitle>
              {summary ? (
                <p className="mt-1 text-sm text-[var(--app-text-muted)] line-clamp-2">{summary}</p>
              ) : null}
            </div>

            <nav aria-label="Progresso do wizard">
              <ol className="flex flex-wrap gap-2">
                {STEPS.map((item, index) => (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      index === step
                        ? "border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]"
                        : index < step
                          ? "border-[var(--app-border)] text-[var(--app-text-soft)]"
                          : "border-[var(--app-border)] text-[var(--app-text-muted)]"
                    )}
                  >
                    {index + 1}. {item.label}
                  </li>
                ))}
              </ol>
            </nav>

            <Surface className="space-y-4 p-4">
              {step === 0 ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-[var(--app-text)]">Repositórios</h2>
                  <p className="text-sm text-[var(--app-text-muted)]">
                    Selecione um ou mais repositórios monitorados. A mesma branch será criada em cada um.
                  </p>
                  {repositoriesLoading ? (
                    <div className="space-y-2" aria-busy="true">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : repositoriesError ? (
                    <p className="text-sm text-destructive" role="alert">{repositoriesError}</p>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {repositories.map((item) => {
                        const checked = selectedRepos.includes(item.repository);
                        return (
                          <li key={item.repository}>
                            <label
                              className="flex items-center gap-3 rounded-lg border border-[var(--app-border)] p-3 cursor-pointer hover:bg-[var(--app-surface-hover)]"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleRepo(item.repository, value === true)
                                }
                                aria-label={`Selecionar ${item.repository}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="font-mono text-sm text-[var(--app-text)]">
                                  {item.repository}
                                </span>
                                <span className="mt-0.5 block text-xs text-[var(--app-text-muted)]">
                                  default: {item.defaultBranch}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--app-text)]">Nome da branch</h2>
                    <p className="text-sm text-[var(--app-text-muted)]">
                      Sugestão por IA do slug em inglês. Prefixo automático por tipo do ticket.
                    </p>
                  </div>

                  {suggestLoading ? (
                    <div className="space-y-2" aria-busy="true" aria-label="Gerando nome">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : null}

                  {suggestError ? (
                    <p className="text-sm text-destructive" role="alert">{suggestError}</p>
                  ) : null}

                  {!aiAvailable && !suggestLoading ? (
                    <p className="text-sm text-[var(--app-text-muted)]">
                      IA indisponível — informe o slug manualmente.
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-text)]" htmlFor="jira-branch-slug">
                      Slug (inglês)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-[var(--app-text-soft)]">
                        {prefix}/{keySegment}/
                      </span>
                      <Input
                        id="jira-branch-slug"
                        className="max-w-xs font-mono"
                        value={slug}
                        onChange={(event) => {
                          setSlug(event.target.value);
                          if (slugError) {
                            setSlugError(null);
                          }
                        }}
                        placeholder="add-login-endpoint"
                        aria-invalid={slugError ? true : undefined}
                      />
                    </div>
                    {slugError ? (
                      <p className="text-sm text-destructive" role="alert">{slugError}</p>
                    ) : (
                      <p className="font-mono text-xs text-[var(--app-text-muted)]">
                        {fullBranchName}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={suggestLoading || !aiAvailable}
                    onClick={() => void runSuggest()}
                  >
                    {suggestLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="size-4" aria-hidden />
                    )}
                    Gerar novamente
                  </Button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--app-text)]">Branch base</h2>
                    <p className="text-sm text-[var(--app-text-muted)]">
                      Cada repositório usa sua branch base. Padrão:{" "}
                      <span className="font-mono">main</span> ou{" "}
                      <span className="font-mono">master</span> do cadastro.
                    </p>
                  </div>

                  {existsWarningRepos.length > 0 ? (
                    <Surface
                      variant="inset"
                      className="border-amber-500/35 p-3 text-sm text-[var(--app-text-soft)]"
                      role="status"
                    >
                      <p className="font-medium text-amber-400">Branch já existe</p>
                      <p className="mt-1">
                        <span className="font-mono">{branchNamePreview || fullBranchName}</span> já
                        existe em: {existsWarningRepos.join(", ")}. A criação será ignorada nesses
                        repos.
                      </p>
                    </Surface>
                  ) : null}

                  <ul className="space-y-3" role="list">
                    {selectedRepos.map((repository) => {
                      const state = repoBaseState[repository];
                      return (
                        <li key={repository}>
                          <Surface variant="inset" className="space-y-2 p-3">
                            <p className="font-mono text-sm font-medium text-[var(--app-text)]">
                              {repository}
                            </p>
                            {state?.loading ? (
                              <Skeleton className="h-10 w-full max-w-md" />
                            ) : state?.error ? (
                              <p className="text-sm text-destructive">{state.error}</p>
                            ) : (
                              <Select
                                value={state?.baseBranch ?? ""}
                                onValueChange={(value) => {
                                  if (typeof value !== "string" || !value) {
                                    return;
                                  }
                                  setRepoBaseState((current) => ({
                                    ...current,
                                    [repository]: {
                                      ...current[repository],
                                      baseBranch: value
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger
                                  className="max-w-md"
                                  aria-label={`Branch base de ${repository}`}
                                >
                                  <SelectValue placeholder="Branch base" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(state?.options ?? []).map((branchName) => (
                                    <SelectItem key={branchName} value={branchName}>
                                      {branchName}
                                      {branchName === state?.defaultBranch ? " (default)" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </Surface>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
                    <GitBranch className="size-4 shrink-0" aria-hidden />
                    <span className="font-mono">{branchNamePreview || fullBranchName}</span>
                  </div>
                </div>
              ) : null}
            </Surface>

            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || isCreating}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Voltar
              </Button>

              {step < 2 ? (
                <Button type="button" onClick={() => void handleNext()}>
                  Continuar
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              ) : (
                <Button type="button" disabled={isCreating} onClick={() => void handleCreate()}>
                  {isCreating ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <GitBranch className="size-4" aria-hidden />
                  )}
                  Criar branch(es)
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
