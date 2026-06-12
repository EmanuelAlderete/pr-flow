export const TASKS_UPDATED_EVENT = "prflow:tasks-updated";

export function dispatchTasksUpdated() {
  window.dispatchEvent(new CustomEvent(TASKS_UPDATED_EVENT));
}

