"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ListTodo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useDashboardOpenTasks } from "@/modules/dashboard/hooks/use-dashboard-open-tasks";
import type { OpenTaskDto } from "@/modules/tasks/lib/domain";

const MAX_VISIBLE_TASKS = 8;

export function DashboardTasksWidget() {
  const { openTasks, isLoading, error, completeTask, overdueCount, refresh } =
    useDashboardOpenTasks();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const visibleTasks = openTasks.slice(0, MAX_VISIBLE_TASKS);
  const hiddenCount = Math.max(0, openTasks.length - MAX_VISIBLE_TASKS);

  async function handleComplete(task: OpenTaskDto) {
    setCompletingId(task.id);
    try {
      await completeTask(task.id);
      toast.success(`“${task.title}” concluída.`);
    } catch {
      toast.error("Não foi possível concluir a tarefa.");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <section className="flex min-h-0 flex-col space-y-4" data-testid="dashboard-tasks-widget">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <ListTodo className="size-5 text-primary" aria-hidden />
            Tarefas
          </h2>
          <Link
            href="/tasks"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 px-2 text-xs")}
          >
            Ver todas
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Carregando lista…"
            : openTasks.length === 0
              ? "Nenhuma tarefa em aberto."
              : overdueCount > 0
                ? `${openTasks.length} em aberto · ${overdueCount} atrasada${overdueCount === 1 ? "" : "s"}`
                : `${openTasks.length} em aberto`}
        </p>
      </div>

      <Surface className="flex min-h-[min(50vh,420px)] flex-1 flex-col p-3 md:p-4">
        {isLoading ? (
          <ul className="space-y-2" aria-label="Carregando tarefas">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="panel-inset flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="size-4 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))}
          </ul>
        ) : null}

        {error && !isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && openTasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
            <p className="text-sm text-[var(--app-text-muted)]">Lista vazia por agora.</p>
            <Link href="/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Criar tarefa
            </Link>
          </div>
        ) : null}

        {!isLoading && !error && openTasks.length > 0 ? (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5" aria-label="Tarefas em aberto">
            {visibleTasks.map((task) => (
              <DashboardTaskRow
                key={task.id}
                task={task}
                isCompleting={completingId === task.id}
                onComplete={() => void handleComplete(task)}
              />
            ))}
          </ul>
        ) : null}

        {hiddenCount > 0 ? (
          <p className="mt-3 border-t border-[var(--app-border)] pt-3 text-center text-xs text-muted-foreground">
            + {hiddenCount} {hiddenCount === 1 ? "tarefa" : "tarefas"} em{" "}
            <Link href="/tasks" className="text-[var(--app-link)] underline-offset-2 hover:underline">
              Tarefas
            </Link>
          </p>
        ) : null}
      </Surface>
    </section>
  );
}

function DashboardTaskRow({
  task,
  isCompleting,
  onComplete
}: {
  task: OpenTaskDto;
  isCompleting: boolean;
  onComplete: () => void;
}) {
  const label = `Concluir ${task.title}`;

  return (
    <li className="panel-inset flex items-start gap-2.5 px-2.5 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={false}
        aria-label={label}
        disabled={isCompleting}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border border-input bg-background transition-colors",
          "hover:border-[var(--brand-border)] hover:bg-[var(--brand-dim)]",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        onClick={onComplete}
      >
        {isCompleting ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-[var(--app-text)]">{task.title}</p>
          {task.isOverdue ? (
            <span className="shrink-0 rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
              Atrasada
            </span>
          ) : null}
        </div>
        {task.dueDate ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3 shrink-0" aria-hidden />
            <span>{task.dueDate}</span>
          </p>
        ) : null}
      </div>
    </li>
  );
}
