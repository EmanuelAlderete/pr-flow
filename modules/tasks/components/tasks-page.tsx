"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { OpenTaskDto, TaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";

type FieldErrors = Record<string, string>;

const emptyLists: TaskListResponse = { open: [], completed: [] };

export function TasksPage() {
  const [lists, setLists] = useState<TaskListResponse>(emptyLists);
  const [createTitle, setCreateTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<TaskDto | null>(null);

  const loadTasks = useCallback(async () => {
    const response = await fetch("/api/tasks");
    if (!response.ok) {
      throw new Error("Falha ao carregar Tasks.");
    }
    return (await response.json()) as TaskListResponse;
  }, []);

  const refreshLists = useCallback(async () => {
    setLists(await loadTasks());
  }, [loadTasks]);

  useEffect(() => {
    refreshLists().catch(() => toast.error("Não foi possível carregar a Task list."));
  }, [refreshLists]);

  function closeEditDialog() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setFieldErrors({});
  }

  function startEdit(task: TaskDto) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ?? "");
    setFieldErrors({});
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: createTitle })
      });

      if (response.status === 400) {
        const body = (await response.json()) as { errors: FieldErrors };
        setCreateError(body.errors.title ?? "Não foi possível criar a Task.");
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao criar Task.");
      }

      setCreateTitle("");
      await refreshLists();
    } catch {
      toast.error("Não foi possível criar a Task.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) {
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      title,
      description: description.length > 0 ? description : null,
      dueDate: dueDate.length > 0 ? dueDate : null
    };

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.status === 400) {
        const body = (await response.json()) as { errors: FieldErrors };
        setFieldErrors(body.errors);
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao editar Task.");
      }

      closeEditDialog();
      await refreshLists();
    } catch {
      toast.error("Não foi possível editar a Task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runTaskAction(
    id: string,
    body: Record<string, string>,
    errorMessage: string
  ) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(errorMessage);
      }
      if (editingTask?.id === id) {
        closeEditDialog();
      }
      await refreshLists();
    } catch {
      toast.error(errorMessage);
    }
  }

  async function handleComplete(id: string) {
    await runTaskAction(id, { action: "complete" }, "Não foi possível concluir a tarefa.");
  }

  async function handleReopen(id: string) {
    await runTaskAction(id, { action: "reopen" }, "Não foi possível reabrir a tarefa.");
  }

  async function confirmRemove() {
    if (!taskToRemove) {
      return;
    }

    const task = taskToRemove;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao Remove.");
      }
      setTaskToRemove(null);
      if (editingTask?.id === task.id) {
        closeEditDialog();
      }
      await refreshLists();
    } catch {
      toast.error("Não foi possível remover a tarefa.");
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <Surface aria-label="Tarefas abertas" className="min-w-0 p-4">
        <h2 className="text-sm font-semibold text-[var(--app-text-muted)]">Tarefas abertas</h2>
        <form className="mt-4 space-y-1" onSubmit={handleCreate}>
          <label className="sr-only" htmlFor="new-task-title">
            Nova Task
          </label>
          <Input
            id="new-task-title"
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            placeholder="Nova Task..."
            aria-invalid={createError ? true : undefined}
            maxLength={200}
            required
            disabled={isCreating}
          />
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
        </form>
        <ul className="mt-4 space-y-2">
          {lists.open.length === 0 ? (
            <li className="text-sm text-[var(--app-text-muted)]">Nenhuma tarefa aberta.</li>
          ) : (
            lists.open.map((task) => (
              <OpenTaskCard
                key={task.id}
                task={task}
                onSelect={() => startEdit(task)}
                onComplete={() => handleComplete(task.id)}
                onRemove={() => setTaskToRemove(task)}
              />
            ))
          )}
        </ul>
      </Surface>

      <Surface aria-label="Tarefas concluídas" className="min-w-0 p-4">
        <h2 className="text-sm font-semibold text-[var(--app-text-muted)]">Tarefas concluídas</h2>
        <ul className="mt-4 space-y-2">
          {lists.completed.length === 0 ? (
            <li className="text-sm text-[var(--app-text-muted)]">Nenhuma tarefa concluída.</li>
          ) : (
            lists.completed.map((task) => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onSelect={() => startEdit(task)}
                onReopen={() => handleReopen(task.id)}
                onRemove={() => setTaskToRemove(task)}
              />
            ))
          )}
        </ul>
      </Surface>

      <Dialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Editar Task</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="task-title">
                Título da Task
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={fieldErrors.title ? true : undefined}
                maxLength={200}
                required
              />
              {fieldErrors.title ? <p className="text-sm text-destructive">{fieldErrors.title}</p> : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="task-description">
                Descrição (opcional)
              </label>
              <textarea
                id="task-description"
                className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={fieldErrors.description ? true : undefined}
                maxLength={2000}
              />
              {fieldErrors.description ? (
                <p className="text-sm text-destructive">{fieldErrors.description}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="task-due-date">
                Data de entrega (opcional)
              </label>
              <DatePicker
                id="task-due-date"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Selecionar data"
                aria-invalid={fieldErrors.dueDate ? true : undefined}
              />
              {fieldErrors.dueDate ? <p className="text-sm text-destructive">{fieldErrors.dueDate}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={taskToRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Task</AlertDialogTitle>
            <AlertDialogDescription>
              Remover a Task &quot;{taskToRemove?.title}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmRemove()}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TaskDueDate({ dueDate }: { dueDate: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <CalendarDays className="size-3 shrink-0" aria-hidden />
      <span>{dueDate}</span>
    </p>
  );
}

function TaskCheckbox({
  checked,
  taskTitle,
  onToggle
}: {
  checked: boolean;
  taskTitle: string;
  onToggle: () => void;
}) {
  const label = checked ? `Reabrir ${taskTitle}` : `Concluir ${taskTitle}`;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "mt-0.5 size-4 shrink-0 rounded-md border transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        checked
          ? "flex items-center justify-center border-[var(--brand-border)] bg-primary text-primary-foreground"
          : "border-input bg-background hover:border-[var(--brand-border)] hover:bg-[var(--brand-dim)]"
      )}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {checked ? <Check className="size-3" aria-hidden /> : null}
    </button>
  );
}

function RemoveTaskButton({ taskTitle, onRemove }: { taskTitle: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Remover ${taskTitle}`}
      className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function OpenTaskCard({
  task,
  onSelect,
  onComplete,
  onRemove
}: {
  task: OpenTaskDto;
  onSelect: () => void;
  onComplete: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="panel-inset flex items-start gap-3 px-3 py-2">
      <TaskCheckbox checked={false} taskTitle={task.title} onToggle={onComplete} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{task.title}</p>
          {task.isOverdue ? (
            <span className="shrink-0 rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
              Atrasada
            </span>
          ) : null}
        </div>
        {task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}
        {task.dueDate ? <TaskDueDate dueDate={task.dueDate} /> : null}
      </button>
      <RemoveTaskButton taskTitle={task.title} onRemove={onRemove} />
    </li>
  );
}

function CompletedTaskCard({
  task,
  onSelect,
  onReopen,
  onRemove
}: {
  task: TaskDto;
  onSelect: () => void;
  onReopen: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="panel-inset flex items-start gap-3 px-3 py-2">
      <TaskCheckbox checked taskTitle={task.title} onToggle={onReopen} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="font-medium">{task.title}</p>
        {task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}
        {task.dueDate ? <TaskDueDate dueDate={task.dueDate} /> : null}
      </button>
      <RemoveTaskButton taskTitle={task.title} onRemove={onRemove} />
    </li>
  );
}
