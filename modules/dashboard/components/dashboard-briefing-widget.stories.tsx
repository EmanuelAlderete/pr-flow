import { sb } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";
import { clearDashboardBriefingCache } from "@/modules/dashboard/lib/dashboard-widget-cache";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { ptBR } from "@/modules/messages/pt-BR";
import { previousBusinessDay } from "@/modules/summaries/lib/summary-period";

import { DashboardBriefingWidget } from "./dashboard-briefing-widget";

sb.mock(import("@/modules/llm-generation"), { spy: true });

const NO_INPUT_MESSAGE =
  "Não há tickets Jira, tarefas, anotações nem atividade de PR suficientes para gerar o briefing do dash — aguardando dados ou sincronização.";

const today = todayLocalDateString();
const previousDay = previousBusinessDay(today);

const filledSummary = [
  "## Fechamento de ontem",
  "",
  "A revisão da PR de faturamento ficou pendente e o ticket da sprint avançou para em andamento.",
  "",
  "## Desbloqueios",
  "",
  "- Confirmar o horário da daily com o time de produto.",
  "- Responder o comentário na PR #418.",
  "",
  "## Foco de hoje",
  "",
  "Fechar o deck de atalhos e atualizar o briefing do dash."
].join("\n");

const readyBriefing: DashboardBriefingResponse = {
  status: "ok",
  day: today,
  previousBusinessDay: previousDay,
  summary: filledSummary,
  generatedAt: `${today}T12:00:00.000Z`
};

const waitingBriefing: DashboardBriefingResponse = {
  status: "not_generated",
  day: today,
  previousBusinessDay: previousDay
};

const missingApiKeyBriefing: DashboardBriefingResponse = {
  status: "missing_api_key",
  message: ptBR.briefing.missingApiKey
};

const noInputBriefing: DashboardBriefingResponse = {
  status: "no_input",
  day: today,
  message: NO_INPUT_MESSAGE
};

const rateLimitedBriefing: DashboardBriefingResponse = {
  status: "rate_limited",
  message: ptBR.gemini.rateLimit
};

const errorBriefing: DashboardBriefingResponse = {
  status: "error",
  message: ptBR.briefing.generationFailed
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

function clearBriefingSession(): void {
  clearDashboardBriefingCache(today);
  const prefixes = ["pr-flow:dashboard-briefing-v1:", "pr-flow:dashboard-daily-summary-v1:"];
  const keys: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

function installFetch(body: DashboardBriefingResponse | "pending", status = 200): () => void {
  clearBriefingSession();
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (body === "pending") {
      return new Promise<Response>(() => undefined);
    }
    const url = requestUrl(input);
    if (url.includes("/api/dashboard/briefing")) {
      return json(body, status);
    }
    return json({ message: "Not mocked" }, 404);
  }) as typeof fetch;

  return () => {
    clearBriefingSession();
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/DashboardBriefingWidget",
  component: DashboardBriefingWidget,
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    )
  ],
  beforeEach: () => installFetch(readyBriefing)
} satisfies Meta<typeof DashboardBriefingWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Waiting: Story = {
  beforeEach: () => installFetch(waitingBriefing)
};

export const MissingApiKey: Story = {
  beforeEach: () => installFetch(missingApiKeyBriefing, 503)
};

export const NoInput: Story = {
  beforeEach: () => installFetch(noInputBriefing, 422)
};

export const RateLimited: Story = {
  beforeEach: () => installFetch(rateLimitedBriefing, 429)
};

export const Error: Story = {
  beforeEach: () => installFetch(errorBriefing, 400)
};

export const Loading: Story = {
  beforeEach: () => installFetch("pending")
};
