import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TaskListResponse } from "@/modules/tasks/lib/domain";

import { TasksPage } from "./tasks-page";

const emptyLists: TaskListResponse = { open: [], completed: [] };

const filledLists: TaskListResponse = {
  open: [
    {
      id: "task-open-overdue",
      title: "Revisar pull request do fluxo de alertas",
      description: "Conferir os toasts quando a pull request muda de status.",
      dueDate: "2026-10-10",
      completedAt: null,
      createdAt: "2026-10-08T11:00:00.000Z",
      updatedAt: "2026-10-08T11:00:00.000Z",
      isOverdue: true
    },
    {
      id: "task-open-upcoming",
      title: "Escrever a nota do standup",
      description: null,
      dueDate: "2026-10-20",
      completedAt: null,
      createdAt: "2026-10-15T09:00:00.000Z",
      updatedAt: "2026-10-15T09:00:00.000Z",
      isOverdue: false
    }
  ],
  completed: [
    {
      id: "task-done",
      title: "Publicar o resumo de quinta",
      description: "Resumo diário gerado e conferido.",
      dueDate: "2026-10-15",
      completedAt: "2026-10-15T18:30:00.000Z",
      createdAt: "2026-10-15T08:00:00.000Z",
      updatedAt: "2026-10-15T18:30:00.000Z"
    }
  ]
};

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function installTasksFetch(lists: TaskListResponse): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/tasks") && method === "GET") {
      return Response.json(lists);
    }

    if (method === "POST") {
      return Response.json({
        id: "task-nova",
        title: "Nova tarefa",
        description: null,
        dueDate: null,
        completedAt: null,
        createdAt: "2026-10-16T12:00:00.000Z",
        updatedAt: "2026-10-16T12:00:00.000Z"
      });
    }

    return Response.json({ ok: true });
  };

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Tasks/TasksPage",
  component: TasksPage,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof TasksPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  beforeEach: () => installTasksFetch(emptyLists)
};

export const Filled: Story = {
  beforeEach: () => installTasksFetch(filledLists)
};
