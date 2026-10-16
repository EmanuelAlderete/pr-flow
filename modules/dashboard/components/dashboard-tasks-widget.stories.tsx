import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { shiftNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import type { OpenTaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";

import { DashboardTasksWidget } from "./dashboard-tasks-widget";

const today = todayLocalDateString();
const yesterday = shiftNotebookDay(today, -1);
const tomorrow = shiftNotebookDay(today, 1);

function openTask(
  id: string,
  title: string,
  dueDate: string | null,
  isOverdue: boolean
): OpenTaskDto {
  return {
    id,
    title,
    description: null,
    dueDate,
    completedAt: null,
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: `${today}T12:00:00.000Z`,
    isOverdue
  };
}

const filledTasks: TaskListResponse = {
  open: [
    openTask("tarefa-1", "Revisar a PR do faturamento", yesterday, true),
    openTask("tarefa-2", "Responder o comentário no Jira", tomorrow, false),
    openTask("tarefa-3", "Atualizar o journal de hoje", null, false)
  ],
  completed: [
    {
      id: "tarefa-feita",
      title: "Enviar o resumo de ontem",
      description: null,
      dueDate: null,
      completedAt: `${today}T15:00:00.000Z`,
      createdAt: `${today}T09:00:00.000Z`,
      updatedAt: `${today}T15:00:00.000Z`
    }
  ]
};

const emptyTasks: TaskListResponse = { open: [], completed: [] };

const overflowTasks: TaskListResponse = {
  open: Array.from({ length: 9 }, (_, index) =>
    openTask(
      `tarefa-${index + 1}`,
      `Acompanhar item ${index + 1} da lista`,
      index === 0 ? yesterday : null,
      index === 0
    )
  ),
  completed: []
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

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function installFetch(body: TaskListResponse | "error" | "pending"): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (body === "pending") {
      return new Promise<Response>(() => undefined);
    }

    const url = requestUrl(input);
    if (url.includes("/api/tasks/") && init?.method === "PATCH") {
      return json({ ok: true });
    }
    if (body === "error") {
      return json({ message: "Falha ao carregar tarefas." }, 500);
    }
    return json(body);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/DashboardTasksWidget",
  component: DashboardTasksWidget,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ],
  beforeEach: () => installFetch(filledTasks)
} satisfies Meta<typeof DashboardTasksWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => installFetch(emptyTasks)
};

export const Overflow: Story = {
  beforeEach: () => installFetch(overflowTasks)
};

export const Error: Story = {
  beforeEach: () => installFetch("error")
};

export const Loading: Story = {
  beforeEach: () => installFetch("pending")
};
