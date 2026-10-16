import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppNotificationProvider } from "./app-notification-provider";

const MONITOR_CACHE_KEY = "pr-flow:last-sync";
const QUEUE_CACHE_KEY = "pr-flow:reviewer-queue-last-sync";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function replaceLocalStorageItem(key: string, value: string | null): () => void {
  const previous = window.localStorage.getItem(key);
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }

  return () => {
    if (previous === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, previous);
    }
  };
}

function installPrFetch(): () => void {
  const original = globalThis.fetch;
  const payload = {
    status: "ok",
    data: [],
    fetchedAt: "2026-10-16T12:00:00.000Z",
    githubLogin: "rigon"
  };

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes("/api/prs/reviewer-queue") || url.includes("/api/prs")) {
      return Response.json(payload);
    }
    return Response.json(payload);
  };

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Notifications/AppNotificationProvider",
  component: AppNotificationProvider,
  beforeEach: () => {
    const restoreMonitor = replaceLocalStorageItem(MONITOR_CACHE_KEY, null);
    const restoreQueue = replaceLocalStorageItem(QUEUE_CACHE_KEY, null);
    const restoreFetch = installPrFetch();
    return () => {
      restoreFetch();
      restoreQueue();
      restoreMonitor();
    };
  }
} satisfies Meta<typeof AppNotificationProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <AppNotificationProvider />
      <p className="text-sm text-[var(--app-text)]">
        Provedor de notificações montado. Ele não desenha uma tela própria: os alertas de pull
        request aparecem como toast quando o aplicativo está em primeiro plano.
      </p>
    </div>
  )
};
