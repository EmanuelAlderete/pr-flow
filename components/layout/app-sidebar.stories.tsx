import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "./app-sidebar";

const REVIEWER_QUEUE_KEY = "pr-flow:reviewer-queue-last-sync";
const MONITOR_SYNC_KEY = "pr-flow:last-sync";
const WEATHER_CACHE_KEY = "pr-flow:weather-v3";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function installFetchMock(): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = requestUrl(input);

    if (url.includes("/api/weather")) {
      return jsonResponse({
        temperatureC: 24,
        weatherCode: 1,
        conditionLabel: "Predominantemente limpo",
        maxTempC: 28,
        minTempC: 18
      });
    }

    if (url.includes("geocoding-api.open-meteo.com") || url.includes("api.bigdatacloud.net")) {
      return jsonResponse({
        results: [
          {
            latitude: -23.55,
            longitude: -46.63,
            name: "São Paulo",
            admin1: "São Paulo"
          }
        ],
        city: "São Paulo",
        principalSubdivision: "São Paulo"
      });
    }

    if (url.includes("/api/settings/github-login")) {
      return jsonResponse({ githubLogin: null });
    }

    return jsonResponse({ error: "mocked" }, 404);
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function denyGeolocation(): () => void {
  const geolocation: Geolocation = {
    getCurrentPosition(_success, error) {
      error?.({
        code: 1,
        message: "Permissão negada",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
    },
    watchPosition() {
      return 0;
    },
    clearWatch() {}
  };

  try {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation
    });
  } catch {
    return () => {};
  }

  return () => {
    Reflect.deleteProperty(navigator, "geolocation");
  };
}

function seedSidebarStorage(): () => void {
  const previousQueue = window.localStorage.getItem(REVIEWER_QUEUE_KEY);
  const previousMonitor = window.localStorage.getItem(MONITOR_SYNC_KEY);
  const previousWeather = window.sessionStorage.getItem(WEATHER_CACHE_KEY);

  window.localStorage.removeItem(MONITOR_SYNC_KEY);
  window.sessionStorage.removeItem(WEATHER_CACHE_KEY);
  window.localStorage.setItem(
    REVIEWER_QUEUE_KEY,
    JSON.stringify({
      status: "ok",
      fetchedAt: "2026-10-16T13:00:00.000Z",
      githubLogin: "maria.souza",
      data: [
        {
          id: "PR_42",
          number: 42,
          title: "Corrigir filtro de tarefas",
          url: "https://example.com/pull/42",
          repository: "acme/app",
          myReviewStatus: "pending"
        }
      ]
    })
  );

  return () => {
    restoreStorageItem(window.localStorage, REVIEWER_QUEUE_KEY, previousQueue);
    restoreStorageItem(window.localStorage, MONITOR_SYNC_KEY, previousMonitor);
    restoreStorageItem(window.sessionStorage, WEATHER_CACHE_KEY, previousWeather);
  };
}

function restoreStorageItem(storage: Storage, key: string, previous: string | null) {
  if (previous === null) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, previous);
}

const meta = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/"
      }
    }
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    )
  ],
  async beforeEach() {
    const restoreFetch = installFetchMock();
    const restoreGeolocation = denyGeolocation();
    const restoreStorage = seedSidebarStorage();

    return () => {
      restoreFetch();
      restoreGeolocation();
      restoreStorage();
    };
  }
} satisfies Meta<typeof AppSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialGithubLogin: "maria.souza"
  }
};

export const Loading: Story = {};
