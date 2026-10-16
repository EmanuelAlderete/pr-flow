import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { CronsPage } from "./crons-page";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const meta = {
  title: "Devtools/CronsPage",
  component: CronsPage,
  beforeEach: () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: FetchInput, _init?: FetchInit) => {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const path = new URL(raw, "http://storybook.local").pathname;
      if (path === "/api/devtools/crons/run") {
        return jsonResponse({
          jobId: "cron:jira-sync",
          status: "ok",
          message: "Fluxo executado no catálogo."
        });
      }
      return jsonResponse({ error: "Rota não mockada no Storybook." }, 404);
    }) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof CronsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Confirmation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [button] = canvas.getAllByRole("button", { name: /forçar execução/i });
    if (!button) {
      return;
    }
    await userEvent.click(button);
  }
};
