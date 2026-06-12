"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpenTaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";
import { TASKS_UPDATED_EVENT } from "@/modules/tasks/lib/task-events";

export function useDashboardOpenTasks() {
  const [openTasks, setOpenTasks] = useState<OpenTaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Falha ao carregar tarefas.");
      }
      const body = (await response.json()) as TaskListResponse;
      setOpenTasks(body.open);
    } catch {
      setError("Não foi possível carregar as tarefas.");
      setOpenTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleTasksUpdated = () => {
      void refresh();
    };

    window.addEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated);
  }, [refresh]);

  const completeTask = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" })
      });

      if (!response.ok) {
        throw new Error("Falha ao concluir tarefa.");
      }

      await refresh();
    },
    [refresh]
  );

  const overdueCount = openTasks.filter((task) => task.isOverdue).length;

  return {
    openTasks,
    isLoading,
    error,
    refresh,
    completeTask,
    overdueCount
  };
}
