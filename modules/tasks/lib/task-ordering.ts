import type { OpenTaskDto, TaskDto } from "@/modules/tasks/lib/domain";

export function sortOpenTasks(tasks: OpenTaskDto[]): OpenTaskDto[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate === null && b.dueDate === null) {
      return 0;
    }
    if (a.dueDate === null) {
      return 1;
    }
    if (b.dueDate === null) {
      return -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function sortCompletedTasks(tasks: TaskDto[]): TaskDto[] {
  return [...tasks].sort((a, b) => {
    const aTime = a.completedAt ?? "";
    const bTime = b.completedAt ?? "";
    return bTime.localeCompare(aTime);
  });
}
