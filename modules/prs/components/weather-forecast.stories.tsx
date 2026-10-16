import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WeatherForecast } from "./weather-forecast";

const WEATHER_CACHE_KEY = "pr-flow:weather-v3";

type WeatherMockMode = "ready" | "error" | "loading";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function denyGeolocation(): () => void {
  const geo = navigator.geolocation;
  if (!geo) {
    return () => undefined;
  }

  const original = geo.getCurrentPosition;
  try {
    geo.getCurrentPosition = (_success, error) => {
      error?.({
        code: 1,
        message: "Permissão negada",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
    };
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      geo.getCurrentPosition = original;
    } catch {
      // The browser may expose geolocation as read-only.
    }
  };
}

function installWeatherMocks(mode: WeatherMockMode): () => void {
  const originalFetch = globalThis.fetch;
  const restoreGeolocation = denyGeolocation();
  try {
    window.sessionStorage.removeItem(WEATHER_CACHE_KEY);
  } catch {
    // Ignore privacy mode.
  }

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (mode === "loading") {
      return new Promise<Response>(() => undefined);
    }

    if (mode === "error") {
      return new Response(JSON.stringify({ error: "Tempo indisponível" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = requestUrl(input);
    if (url.includes("geocoding-api.open-meteo.com")) {
      return Response.json({
        results: [
          {
            name: "São Paulo",
            admin1: "São Paulo",
            latitude: -23.55,
            longitude: -46.63
          }
        ]
      });
    }

    if (url.includes("/api/weather")) {
      return Response.json({
        temperatureC: 24.4,
        weatherCode: 2,
        conditionLabel: "Parcialmente nublado",
        maxTempC: 28.1,
        minTempC: 18.6
      });
    }

    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
    restoreGeolocation();
    try {
      window.sessionStorage.removeItem(WEATHER_CACHE_KEY);
    } catch {
      // Ignore privacy mode.
    }
  };
}

const meta = {
  title: "PRs/WeatherForecast",
  component: WeatherForecast
} satisfies Meta<typeof WeatherForecast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  async beforeEach() {
    return installWeatherMocks("ready");
  }
};

export const Sidebar: Story = {
  args: {
    variant: "sidebar"
  },
  async beforeEach() {
    return installWeatherMocks("ready");
  }
};

export const SidebarCollapsed: Story = {
  args: {
    variant: "sidebar"
  },
  async beforeEach() {
    return installWeatherMocks("ready");
  },
  render: (args) => (
    <div className="group w-16" data-collapsible="icon">
      <WeatherForecast {...args} />
    </div>
  )
};

export const Loading: Story = {
  async beforeEach() {
    return installWeatherMocks("loading");
  }
};

export const Error: Story = {
  async beforeEach() {
    return installWeatherMocks("error");
  }
};
