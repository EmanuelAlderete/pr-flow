import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { WeatherReading } from "@/modules/prs/lib/core/open-meteo-weather";
import {
  clearVacationCountdown,
  saveVacationCountdown,
  VACATION_COUNTDOWN_STORAGE_KEY,
  VACATION_COUNTDOWN_UPDATED_EVENT
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
import type { VacationCountdownStored } from "@/modules/vacation-countdown/lib/vacation-countdown-validation";

import { SidebarAmbientPanel } from "./sidebar-ambient-panel";

const WEATHER_CACHE_KEY = "pr-flow:weather-v3";

const weatherReading: WeatherReading = {
  temperatureC: 27,
  weatherCode: 2,
  conditionLabel: "Parcialmente nublado",
  maxTempC: 31,
  minTempC: 19
};

function localIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withVacation(settings: VacationCountdownStored | null): () => void {
  const previous = window.localStorage.getItem(VACATION_COUNTDOWN_STORAGE_KEY);
  if (settings === null) {
    clearVacationCountdown();
  } else {
    saveVacationCountdown(settings);
  }

  return () => {
    if (previous === null) {
      window.localStorage.removeItem(VACATION_COUNTDOWN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(VACATION_COUNTDOWN_STORAGE_KEY, previous);
    }
    window.dispatchEvent(new Event(VACATION_COUNTDOWN_UPDATED_EVENT));
  };
}

function withWeatherCache(): () => void {
  const previous = window.sessionStorage.getItem(WEATHER_CACHE_KEY);
  window.sessionStorage.setItem(
    WEATHER_CACHE_KEY,
    JSON.stringify({
      coords: { latitude: -23.5505, longitude: -46.6333 },
      cityName: "São Paulo, SP",
      forecast: { ...weatherReading, cityName: "São Paulo, SP" },
      cachedAt: Date.now()
    })
  );

  return () => {
    if (previous === null) {
      window.sessionStorage.removeItem(WEATHER_CACHE_KEY);
    } else {
      window.sessionStorage.setItem(WEATHER_CACHE_KEY, previous);
    }
  };
}

function denyGeolocation(): () => void {
  const hadOwn = Object.prototype.hasOwnProperty.call(navigator, "geolocation");
  const previous = navigator.geolocation;
  try {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback) {
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
        clearWatch() {
          return undefined;
        }
      } satisfies Geolocation
    });
  } catch {
    return () => undefined;
  }

  return () => {
    if (hadOwn) {
      Object.defineProperty(navigator, "geolocation", { configurable: true, value: previous });
    } else {
      Reflect.deleteProperty(navigator, "geolocation");
    }
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function installWeatherFetch(): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes("/api/weather")) {
      return Response.json(weatherReading);
    }
    if (url.includes("geocoding-api.open-meteo.com")) {
      return Response.json({
        results: [{ latitude: -23.5505, longitude: -46.6333, name: "São Paulo", admin1: "São Paulo" }]
      });
    }
    if (url.includes("api.bigdatacloud.net")) {
      return Response.json({ city: "São Paulo", principalSubdivision: "São Paulo" });
    }
    return Response.json({ message: "Not mocked" }, { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/SidebarAmbientPanel",
  component: SidebarAmbientPanel,
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    )
  ],
  beforeEach: () => {
    const restoreGeo = denyGeolocation();
    const restoreWeather = withWeatherCache();
    const restoreFetch = installWeatherFetch();
    const restoreVacation = withVacation({ startDate: localIsoDate(12), promptDismissed: true });
    return () => {
      restoreVacation();
      restoreFetch();
      restoreWeather();
      restoreGeo();
    };
  }
} satisfies Meta<typeof SidebarAmbientPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WeatherOnly: Story = {
  beforeEach: () => withVacation(null)
};
