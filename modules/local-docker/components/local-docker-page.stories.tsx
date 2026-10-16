import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type {
  PortainerRuntimeState,
  PortainerStatus
} from "@/modules/local-docker/lib/local-docker-portainer-service";

import { LocalDockerPage } from "./local-docker-page";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

function portainerStatus(state: PortainerRuntimeState, configured = true): PortainerStatus {
  const statusText: Record<PortainerRuntimeState, string | null> = {
    stopped: configured ? "Container parado" : null,
    starting: "Iniciando o container",
    running: "No ar há 2 horas",
    unhealthy: "No ar, mas o healthcheck falhou"
  };

  return {
    configured,
    portainerUrl: "about:blank",
    state,
    containerName: state === "stopped" ? null : "jusfy-local-portainer-1",
    statusText: statusText[state]
  };
}

function requestUrl(input: FetchInput): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function pathnameOf(input: FetchInput): string {
  return new URL(requestUrl(input), "http://storybook.local").pathname;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function hang(init?: FetchInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) {
      return;
    }
    const abort = () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

function statusFetch(status: PortainerStatus): StoryFetch {
  return (input) => {
    const path = pathnameOf(input);
    if (path === "/api/devtools/local-docker/status") {
      return Promise.resolve(jsonResponse(status));
    }
    if (path === "/api/devtools/local-docker/start") {
      return Promise.resolve(
        jsonResponse({
          status: "ok",
          message: "Portainer em execução no catálogo.",
          portainerUrl: "",
          state: "running"
        })
      );
    }
    return Promise.resolve(jsonResponse({ message: "Rota não mockada no Storybook." }, 404));
  };
}

let respond: StoryFetch = statusFetch(portainerStatus("stopped"));

const meta = {
  title: "Devtools/LocalDockerPage",
  component: LocalDockerPage,
  beforeEach: () => {
    respond = statusFetch(portainerStatus("stopped"));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof LocalDockerPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Running: Story = {
  beforeEach: () => {
    respond = statusFetch(portainerStatus("running"));
  }
};

export const Starting: Story = {
  beforeEach: () => {
    respond = statusFetch(portainerStatus("starting"));
  }
};

export const Unhealthy: Story = {
  beforeEach: () => {
    respond = statusFetch(portainerStatus("unhealthy"));
  }
};

export const Unconfigured: Story = {
  beforeEach: () => {
    respond = statusFetch(portainerStatus("stopped", false));
  }
};

export const Loading: Story = {
  beforeEach: () => {
    respond = (_input, init) => hang(init);
  }
};
