export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskDto = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpenTaskDto = TaskDto & {
  isOverdue: boolean;
};

export type TaskListResponse = {
  open: OpenTaskDto[];
  completed: TaskDto[];
};
