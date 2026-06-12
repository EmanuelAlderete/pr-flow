"use client";

import { useEffect, useState } from "react";
import {
  geocodeCityName,
  getDefaultWeatherCity,
  resolveCityNameFromCoords,
  type Coordinates,
  type WeatherForecast,
  type WeatherReading
} from "@/modules/prs/lib/core/open-meteo-weather";

interface ResolvedLocation {
  coords: Coordinates;
  cityName: string;
}

async function fetchWeatherFromApi(coords: Coordinates): Promise<WeatherReading> {
  const url = new URL("/api/weather", window.location.origin);
  url.searchParams.set("lat", String(coords.latitude));
  url.searchParams.set("lon", String(coords.longitude));

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Falha ao carregar tempo (HTTP ${response.status})`);
  }

  return (await response.json()) as WeatherReading;
}

const CACHE_KEY = "pr-flow:weather-v3";
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedWeather {
  coords: Coordinates;
  cityName: string;
  forecast: WeatherForecast;
  cachedAt: number;
}

type WeatherStatus = "loading" | "ready" | "error";

function readCache(): CachedWeather | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedWeather;
    if (!parsed?.forecast || !parsed.coords || typeof parsed.cachedAt !== "number" || !parsed.cityName) {
      return null;
    }

    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCache(location: ResolvedLocation, forecast: WeatherForecast): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: CachedWeather = {
      coords: location.coords,
      cityName: location.cityName,
      forecast,
      cachedAt: Date.now()
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

function getBrowserCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização indisponível"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function resolveLocation(): Promise<ResolvedLocation> {
  try {
    const coords = await getBrowserCoordinates();

    return {
      coords,
      cityName: await resolveCityNameFromCoords(coords)
    };
  } catch {
    const city = getDefaultWeatherCity();
    const place = await geocodeCityName(city);
    if (!place) {
      throw new Error(`Não foi possível localizar "${city}"`);
    }

    return place;
  }
}

function withCityName(reading: WeatherReading, cityName: string): WeatherForecast {
  return { ...reading, cityName };
}

export function useWeatherForecast() {
  const [status, setStatus] = useState<WeatherStatus>("loading");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = readCache();
      if (cached) {
        setForecast(cached.forecast);
        setStatus("ready");
      }

      try {
        const location = cached
          ? { coords: cached.coords, cityName: cached.cityName }
          : await resolveLocation();
        const reading = await fetchWeatherFromApi(location.coords);
        if (cancelled) {
          return;
        }

        const nextForecast = withCityName(reading, location.cityName);
        writeCache(location, nextForecast);
        setForecast(nextForecast);
        setStatus("ready");
      } catch {
        if (cancelled) {
          return;
        }
        if (!cached) {
          setStatus("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, forecast };
}
