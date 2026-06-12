"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { DEFAULT_OPEN_PR_BASE_BRANCH } from "@/modules/prs/lib/open-pr/constants";

type RepositoryRecord = {
  id: string;
  repository: string;
  defaultBranch: string;
  sortOrder: number;
};

type FormMode = "create" | "edit";

const EMPTY_FORM = {
  repository: "",
  defaultBranch: DEFAULT_OPEN_PR_BASE_BRANCH,
  sortOrder: "0"
};

export function RepositoriesPage() {
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/settings/repositories");
      const payload = (await response.json()) as {
        repositories?: RepositoryRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao carregar repositórios.");
      }

      setRepositories(payload.repositories ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar repositórios.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRepositories();
  }, [loadRepositories]);

  function openCreateDialog() {
    setFormMode("create");
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(repositories.length)
    });
    setDialogOpen(true);
  }

  function openEditDialog(record: RepositoryRecord) {
    setFormMode("edit");
    setEditingId(record.id);
    setForm({
      repository: record.repository,
      defaultBranch: record.defaultBranch,
      sortOrder: String(record.sortOrder)
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);

    try {
      const body = {
        repository: form.repository.trim(),
        defaultBranch: form.defaultBranch.trim(),
        sortOrder: Number.parseInt(form.sortOrder, 10)
      };

      const response = await fetch(
        formMode === "create"
          ? "/api/settings/repositories"
          : `/api/settings/repositories/${editingId}`,
        {
          method: formMode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );

      const payload = (await response.json()) as {
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        if (payload.errors) {
          const first = Object.values(payload.errors)[0];
          toast.error(first ?? "Dados inválidos.");
          return;
        }
        toast.error(payload.error ?? "Não foi possível salvar.");
        return;
      }

      toast.success(formMode === "create" ? "Repositório cadastrado." : "Repositório atualizado.");
      setDialogOpen(false);
      await loadRepositories();
    } catch {
      toast.error("Não foi possível salvar o repositório.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/settings/repositories/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        toast.error(payload.error ?? "Não foi possível remover.");
        return;
      }

      toast.success("Repositório removido.");
      await loadRepositories();
    } catch {
      toast.error("Não foi possível remover o repositório.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <p className="text-sm text-[var(--app-text-soft)]">
          Repositórios usados no sync de PRs e no assistente de abrir PR. Na primeira execução, a
          lista de <code className="text-xs">MONITORED_REPOSITORIES</code> do{" "}
          <code className="text-xs">.env</code> é importada automaticamente se o banco estiver
          vazio.
        </p>
      </Surface>

      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Cadastrar repositório
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--app-text-soft)]">
          <Loader2 className="size-4 animate-spin" />
          Carregando repositórios…
        </div>
      ) : loadError ? (
        <Surface className="border-destructive/40 p-4 text-sm text-destructive">{loadError}</Surface>
      ) : repositories.length === 0 ? (
        <Surface className="p-4 text-sm text-[var(--app-text-soft)]">
          Nenhum repositório cadastrado. Adicione um no formato{" "}
          <span className="font-mono">owner/repo</span>.
        </Surface>
      ) : (
        <div className="space-y-2">
          {repositories.map((record) => (
            <Surface key={record.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-[var(--app-text)]">{record.repository}</p>
                <p className="text-xs text-[var(--app-text-soft)]">
                  Branch principal:{" "}
                  <span className="font-mono text-[var(--app-text)]">{record.defaultBranch}</span>
                  {" · "}
                  Ordem: {record.sortOrder}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Editar ${record.repository}`}
                onClick={() => openEditDialog(record)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Remover ${record.repository}`}
                disabled={deletingId === record.id}
                onClick={() => void handleDelete(record.id)}
              >
                {deletingId === record.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </Surface>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Cadastrar repositório" : "Editar repositório"}
            </DialogTitle>
            <DialogDescription>
              Informe o slug GitHub e a branch principal usada como base ao abrir PRs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--app-text-soft)]">Repositório (owner/repo)</span>
              <Input
                value={form.repository}
                onChange={(event) => setForm((current) => ({ ...current, repository: event.target.value }))}
                placeholder="acme/minha-app"
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--app-text-soft)]">Branch principal</span>
              <Input
                value={form.defaultBranch}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultBranch: event.target.value }))
                }
                placeholder={DEFAULT_OPEN_PR_BASE_BRANCH}
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--app-text-soft)]">Ordem na lista</span>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
