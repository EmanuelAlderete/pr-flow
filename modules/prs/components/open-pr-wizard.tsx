"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Eye, GitBranch, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { NotePreview } from "@/modules/journal/lib/note-preview";
import { extractJiraIssueKeyFromBranch } from "@/modules/jira-issue-key/lib/issue-key-branch";
import { DEFAULT_OPEN_PR_REVIEWERS } from "@/modules/prs/lib/open-pr/constants";
import { cn } from "@/lib/utils";

type RepositoryItem = { repository: string; defaultBranch: string };

type BranchItem = {
  name: string;
  issueKey: string | null;
  suggestedTitle: string | null;
  jiraSummary: string | null;
  baseBranch: string | null;
};

type EditorMode = "edit" | "preview";

const STEPS = [
  { id: "repo", label: "Repositório" },
  { id: "branch", label: "Branch" },
  { id: "content", label: "Conteúdo" },
  { id: "review", label: "Revisão" }
] as const;

function reviewersToText(reviewers: string[]): string {
  return reviewers.join(", ");
}

function parseReviewersText(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function OpenPrWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);

  const [repository, setRepository] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("");
  const [baseBranchOptions, setBaseBranchOptions] = useState<string[]>([]);
  const [baseBranchesLoading, setBaseBranchesLoading] = useState(false);
  const [baseBranchesError, setBaseBranchesError] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchSource, setBranchSource] = useState<"jira" | "github" | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);
  const [manualBranchName, setManualBranchName] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodyEditorMode, setBodyEditorMode] = useState<EditorMode>("edit");
  const [bodyLoading, setBodyLoading] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const bodyGenerationRef = useRef(0);
  const branchesAbortRef = useRef<AbortController | null>(null);

  const [reviewersText, setReviewersText] = useState(reviewersToText([...DEFAULT_OPEN_PR_REVIEWERS]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPrUrl, setCreatedPrUrl] = useState<string | null>(null);

  useEffect(() => {
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

    return () => controller.abort();
  }, []);

  const queryRepository = searchParams.get("repository") ?? "";
  const queryBranch = searchParams.get("branch") ?? "";
  const queryInitializedRef = useRef(false);

  useEffect(() => {
    if (queryInitializedRef.current || repositoriesLoading || repositories.length === 0) {
      return;
    }
    if (!queryRepository) {
      return;
    }

    const selected = repositories.find((item) => item.repository === queryRepository);
    if (!selected) {
      return;
    }

    queryInitializedRef.current = true;
    setRepository(queryRepository);
    setDefaultBranch(selected.defaultBranch);
    setBaseBranch(selected.defaultBranch);
    setStep(1);

    if (queryBranch) {
      setManualBranchName(queryBranch);
      setSelectedBranch(null);
    }
  }, [queryBranch, queryRepository, repositories, repositoriesLoading]);

  const loadBaseBranches = useCallback(async (repo: string, signal?: AbortSignal) => {
    setBaseBranchesLoading(true);
    setBaseBranchesError(null);
    setBaseBranchOptions([]);

    try {
      const response = await fetch(
        `/api/prs/open/base-branches?repository=${encodeURIComponent(repo)}`,
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

      const nextDefaultBranch = payload.defaultBranch ?? "";
      const options = payload.baseBranches ?? [];
      setDefaultBranch(nextDefaultBranch);
      setBaseBranchOptions(options);
      setBaseBranch((current) => {
        if (current.length > 0 && options.includes(current)) {
          return current;
        }
        return nextDefaultBranch;
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Falha ao carregar branches destino.";
      setBaseBranchesError(message);
    } finally {
      if (!signal?.aborted) {
        setBaseBranchesLoading(false);
      }
    }
  }, []);

  const loadBranches = useCallback(async (repo: string, signal?: AbortSignal) => {
    setBranchesLoading(true);
    setBranchesError(null);
    setBranchSource(null);
    setBranches([]);
    setSelectedBranch(null);
    setManualBranchName("");

    try {
      const response = await fetch(`/api/prs/open/branches?repository=${encodeURIComponent(repo)}`, {
        signal
      });
      const payload = (await response.json()) as {
        branches?: BranchItem[];
        branchSource?: "jira" | "github";
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao carregar branches.");
      }

      if (signal?.aborted) {
        return;
      }

      setBranches(payload.branches ?? []);
      setBranchSource(payload.branchSource ?? null);
      if ((payload.branches ?? []).length === 0) {
        setBranchesError(
          "Nenhuma branch encontrada automaticamente. Informe o nome manualmente abaixo."
        );
      }
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      const message = error instanceof Error ? error.message : "Falha ao carregar branches.";
      setBranchesError(message);
    } finally {
      if (!signal?.aborted) {
        setBranchesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!repository) {
      return;
    }

    branchesAbortRef.current?.abort();
    const controller = new AbortController();
    branchesAbortRef.current = controller;
    void loadBranches(repository, controller.signal);
    void loadBaseBranches(repository, controller.signal);

    return () => {
      controller.abort();
    };
  }, [repository, loadBranches, loadBaseBranches]);

  const generateBody = useCallback(
    async (repo: string, branch: BranchItem, prTitle: string, targetBaseBranch: string) => {
      const generation = ++bodyGenerationRef.current;
      setBodyLoading(true);
      setBodyError(null);
      setBody("");

      try {
        const response = await fetch("/api/prs/open/generate-body", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repository: repo,
            branch: branch.name,
            baseBranch: targetBaseBranch,
            title: prTitle
          })
        });

        const payload = (await response.json()) as { body?: string; error?: string; code?: string };

        if (generation !== bodyGenerationRef.current) {
          return;
        }

        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao gerar corpo da PR.");
        }

        setBody(payload.body ?? "");
        setBodyEditorMode("preview");
      } catch (error) {
        if (generation !== bodyGenerationRef.current) {
          return;
        }
        const message = error instanceof Error ? error.message : "Falha ao gerar corpo da PR.";
        setBodyError(message);
      } finally {
        if (generation === bodyGenerationRef.current) {
          setBodyLoading(false);
        }
      }
    },
    []
  );

  const effectiveBranch = useMemo((): BranchItem | null => {
    if (selectedBranch) {
      return selectedBranch;
    }
    const name = manualBranchName.trim();
    if (!name) {
      return null;
    }
    return {
      name,
      issueKey: extractJiraIssueKeyFromBranch(name),
      suggestedTitle: null,
      jiraSummary: null,
      baseBranch: null
    };
  }, [selectedBranch, manualBranchName]);

  useEffect(() => {
    if (step !== 2 || !repository || !effectiveBranch) {
      return;
    }

    const suggested = effectiveBranch.suggestedTitle ?? effectiveBranch.issueKey ?? effectiveBranch.name;
    setTitle(suggested);
    void generateBody(repository, effectiveBranch, suggested, baseBranch);
  }, [step, repository, effectiveBranch, baseBranch, generateBody]);

  function canAdvance(): boolean {
    if (step === 0) {
      return repository.length > 0;
    }
    if (step === 1) {
      return effectiveBranch !== null && baseBranch.length > 0 && !baseBranchesLoading;
    }
    if (step === 2) {
      return title.trim().length > 0 && body.trim().length > 0 && !bodyLoading;
    }
    return true;
  }

  function goNext() {
    if (!canAdvance()) {
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    }
  }

  function goBack() {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  }

  async function handleSubmit() {
    if (!repository || !effectiveBranch) {
      return;
    }

    const reviewers = parseReviewersText(reviewersText);
    if (reviewers.length === 0) {
      toast.error("Informe ao menos um revisor.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/prs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository,
          branch: effectiveBranch.name,
          baseBranch,
          title: title.trim(),
          body: body.trim(),
          reviewers
        })
      });

      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        if (payload.errors) {
          const first = Object.values(payload.errors)[0];
          toast.error(first ?? "Dados inválidos.");
          return;
        }
        toast.error(payload.error ?? "Falha ao criar PR.");
        return;
      }

      setCreatedPrUrl(payload.url ?? null);
      toast.success("Pull request criada.");
    } catch {
      toast.error("Falha ao criar pull request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdPrUrl) {
    return (
      <Surface className="space-y-4 p-6 text-center">
        <Check className="mx-auto size-10 text-[var(--brand-bright)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--app-text)]">PR criada</h2>
        <p className="text-sm text-[var(--app-text-muted)]">
          A pull request foi aberta com sucesso.
        </p>
        <a
          href={createdPrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          Abrir no GitHub
        </a>
      </Surface>
    );
  }

  return (
    <div className="open-pr-wizard space-y-6">
      <nav aria-label="Progresso do formulário">
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

      <Surface className="space-y-4 p-4 md:p-5">
        {step === 0 ? (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--app-text)]">Repositório</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              Escolha o repositório em que a PR será aberta (cadastro em Devtools → Repositórios).
            </p>
            {repositoriesLoading ? (
              <Skeleton className="h-10 w-full max-w-md" />
            ) : repositoriesError ? (
              <p className="text-sm text-destructive" role="alert">
                {repositoriesError}
              </p>
            ) : (
              <Select
                value={repository}
                onValueChange={(value) => {
                  if (typeof value !== "string" || value.length === 0) {
                    return;
                  }
                  setRepository(value);
                  const selected = repositories.find((item) => item.repository === value);
                  setDefaultBranch(selected?.defaultBranch ?? "");
                  setBaseBranch(selected?.defaultBranch ?? "");
                }}
              >
                <SelectTrigger className="max-w-md" aria-label="Repositório">
                  <SelectValue placeholder="Selecione um repositório" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((item) => (
                    <SelectItem key={item.repository} value={item.repository}>
                      {item.repository}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--app-text)]">Branch</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {branchSource === "jira"
                ? "Branches dos seus tickets Jira (Dev Status ou busca por jor-XXX)."
                : branchSource === "github"
                  ? "Branches cujo último commit é seu"
                  : "Branches disponíveis"}{" "}
              em <span className="font-mono text-[var(--app-text-soft)]">{repository}</span>.
            </p>
            {branchesLoading ? (
              <div className="space-y-2" aria-busy="true" aria-label="Carregando branches">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-full max-w-md" />
              </div>
            ) : null}
            {!branchesLoading && branches.length > 0 ? (
              <Select
                value={selectedBranch?.name ?? ""}
                onValueChange={(value) => {
                  const branch = branches.find((item) => item.name === value) ?? null;
                  setSelectedBranch(branch);
                  setManualBranchName("");
                  if (branch?.baseBranch) {
                    setBaseBranch(branch.baseBranch);
                  } else if (defaultBranch) {
                    setBaseBranch(defaultBranch);
                  }
                }}
              >
                <SelectTrigger className="max-w-xl" aria-label="Branch">
                  <SelectValue placeholder="Selecione uma branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <span className="flex items-center gap-2">
                        <GitBranch className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        <span className="truncate font-mono text-xs">{branch.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="open-pr-base-branch" className="text-sm font-medium text-[var(--app-text)]">
                Branch destino (base)
              </label>
              <p className="text-xs text-[var(--app-text-muted)]">
                Usada no diff e ao abrir a PR. Se a base for mergeada na{" "}
                <span className="font-mono">{defaultBranch || "master"}</span>, o destino é atualizado
                automaticamente na sincronização.
              </p>
              {baseBranchesLoading ? (
                <Skeleton className="h-10 w-full max-w-md" />
              ) : baseBranchesError ? (
                <p className="text-sm text-destructive" role="alert">
                  {baseBranchesError}
                </p>
              ) : (
                <Select
                  value={baseBranch}
                  onValueChange={(value) => {
                    if (typeof value === "string" && value.length > 0) {
                      setBaseBranch(value);
                    }
                  }}
                >
                  <SelectTrigger id="open-pr-base-branch" className="max-w-md" aria-label="Branch destino">
                    <SelectValue placeholder="Selecione a branch destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseBranchOptions.map((branchName) => (
                      <SelectItem key={branchName} value={branchName}>
                        <span className="font-mono text-xs">{branchName}</span>
                        {branchName === defaultBranch ? (
                          <span className="text-[var(--app-text-muted)]"> (padrão)</span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {!branchesLoading ? (
              <div className="space-y-2">
                <label htmlFor="open-pr-manual-branch" className="text-sm font-medium text-[var(--app-text)]">
                  {branches.length > 0 ? "Ou digite o nome da branch" : "Nome da branch"}
                </label>
                <Input
                  id="open-pr-manual-branch"
                  value={manualBranchName}
                  onChange={(event) => {
                    setManualBranchName(event.target.value);
                    setSelectedBranch(null);
                  }}
                  aria-label="Nome da branch"
                  placeholder="feat/JOR-123/descricao"
                  className="max-w-xl font-mono text-sm"
                />
              </div>
            ) : null}
            {!branchesLoading && branchesError ? (
              <p className="text-sm text-amber-400/90" role="status">
                {branchesError}
              </p>
            ) : null}
            {effectiveBranch?.issueKey ? (
              <p className="text-xs text-[var(--app-text-muted)]">
                Ticket: {effectiveBranch.issueKey}
                {effectiveBranch.jiraSummary ? ` — ${effectiveBranch.jiraSummary}` : null}
              </p>
            ) : effectiveBranch ? (
              <p className="text-xs text-amber-400/90" role="status">
                Branch sem padrão jor-XXX; o título poderá ser ajustado manualmente.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-[var(--app-text)]">Título</h2>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Título da pull request"
                placeholder="JOR-123 - Título do Jira"
                className="max-w-2xl"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--app-text)]">Corpo da PR</h2>
                <div
                  className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-inset)] p-0.5"
                  role="group"
                  aria-label="Modo do corpo"
                >
                  <Button
                    type="button"
                    variant={bodyEditorMode === "edit" ? "default" : "ghost"}
                    size="sm"
                    className="gap-1.5 rounded-md"
                    onClick={() => setBodyEditorMode("edit")}
                    disabled={bodyLoading}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant={bodyEditorMode === "preview" ? "default" : "ghost"}
                    size="sm"
                    className="gap-1.5 rounded-md"
                    onClick={() => setBodyEditorMode("preview")}
                    disabled={bodyLoading || body.trim().length === 0}
                  >
                    <Eye className="size-3.5" aria-hidden />
                    Preview
                  </Button>
                </div>
              </div>

              {bodyLoading ? (
                <div
                  className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-inset)] p-6"
                  role="status"
                  aria-live="polite"
                  aria-label="Gerando corpo com IA"
                >
                  <Loader2 className="size-6 animate-spin text-[var(--brand)]" aria-hidden />
                  <p className="text-sm text-[var(--app-text-muted)]">
                    Gerando descrição com IA a partir do template e do diff com{" "}
                    <span className="font-mono">{baseBranch}</span>…
                  </p>
                </div>
              ) : bodyError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive" role="alert">
                    {bodyError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (repository && effectiveBranch) {
                        void generateBody(
                          repository,
                          effectiveBranch,
                          title.trim() || effectiveBranch.name,
                          baseBranch
                        );
                      }
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : bodyEditorMode === "edit" ? (
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={18}
                  aria-label="Corpo da pull request"
                  placeholder="Corpo em Markdown…"
                  className="min-h-[16rem] font-mono text-sm"
                />
              ) : (
                <NotePreview markdown={body} />
              )}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--app-text)]">Revisão</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--app-text-muted)]">Repositório</dt>
                <dd className="font-mono text-[var(--app-text)]">{repository}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-muted)]">Branch</dt>
                <dd className="font-mono text-[var(--app-text)]">{effectiveBranch?.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-muted)]">Base</dt>
                <dd className="font-mono text-[var(--app-text)]">{baseBranch}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-muted)]">Título</dt>
                <dd className="text-[var(--app-text)]">{title}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--app-text)]">Corpo (preview)</p>
              <NotePreview markdown={body} />
            </div>

            <div className="space-y-2">
              <label htmlFor="open-pr-reviewers" className="text-sm font-medium text-[var(--app-text)]">
                Revisores
              </label>
              <Input
                id="open-pr-reviewers"
                value={reviewersText}
                onChange={(event) => setReviewersText(event.target.value)}
                aria-describedby="open-pr-reviewers-hint"
                placeholder="login1, login2, login3"
              />
              <p id="open-pr-reviewers-hint" className="text-xs text-[var(--app-text-muted)]">
                Separe logins por vírgula ou espaço.
              </p>
            </div>
          </div>
        ) : null}
      </Surface>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || isSubmitting}>
          <ChevronLeft className="size-4" aria-hidden />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={!canAdvance() || isSubmitting}>
            Próximo
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Criando…
              </>
            ) : (
              "Criar PR"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
