import {
  completeTask,
  createTask,
  listTaskLists,
  reopenTask,
  removeTask,
  updateTask
} from "@/modules/tasks/lib/task-repository";
import type { OpenTaskDto, TaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";
import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  type CreateTaskInput,
  type UpdateTaskInput
} from "@/modules/tasks/lib/task-validation";

export async function getTaskLists(): Promise<TaskListResponse> {
  return listTaskLists();
}

export type CreateTaskResult =
  | { ok: true; task: TaskDto }
  | { ok: false; errors: Record<string, string> };

export async function createTaskFromInput(input: CreateTaskInput): Promise<CreateTaskResult> {
  const validation = validateCreateTaskInput(input);
  if (!validation.ok) {
    return validation;
  }

  const task = await createTask(validation.value);
  return { ok: true, task };
}

export type PatchTaskBody =
  | { action: "complete" }
  | { action: "reopen" }
  | UpdateTaskInput;

export type PatchTaskResult =
  | { ok: true; task: TaskDto | OpenTaskDto }
  | { ok: false; status: 400 | 404; errors?: Record<string, string> };

export async function patchTaskById(id: string, body: PatchTaskBody): Promise<PatchTaskResult> {
  if ("action" in body) {
    if (body.action === "complete") {
      const task = await completeTask(id);
      return task ? { ok: true, task } : { ok: false, status: 404 };
    }
    const task = await reopenTask(id);
    return task ? { ok: true, task } : { ok: false, status: 404 };
  }

  const validation = validateUpdateTaskInput(body);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const task = await updateTask(id, validation.value);
  return task ? { ok: true, task } : { ok: false, status: 404 };
}

export async function removeTaskById(id: string): Promise<{ ok: true } | { ok: false; status: 404 }> {
  const removed = await removeTask(id);
  return removed ? { ok: true } : { ok: false, status: 404 };
}
