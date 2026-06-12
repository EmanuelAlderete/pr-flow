import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeWeatherCode,
  fetchWeatherForecast,
  geocodeCityName,
  NEARBY_WEATHER_LABEL,
  resolveCityNameFromCoords,
  reverseGeocodeCity,
  weatherCodeToIconKind
} from "@/modules/prs/lib/core/open-meteo-weather";

describe("describeWeatherCode", () => {
  it("traduz codigos WMO comuns", () => {
    expect(describeWeatherCode(0)).toBe("Céu limpo");
    expect(describeWeatherCode(2)).toBe("Parcialmente nublado");
    expect(describeWeatherCode(61)).toBe("Chuva");
    expect(describeWeatherCode(95)).toBe("Tempestade");
  });
});

describe("weatherCodeToIconKind", () => {
  it("mapeia codigos WMO para icones", () => {
    expect(weatherCodeToIconKind(0)).toBe("clear");
    expect(weatherCodeToIconKind(2)).toBe("partly-cloudy");
    expect(weatherCodeToIconKind(3)).toBe("cloudy");
    expect(weatherCodeToIconKind(61)).toBe("rain");
    expect(weatherCodeToIconKind(95)).toBe("storm");
  });
});

describe("open-meteo client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("geocodifica cidade por nome", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ latitude: -23.55, longitude: -46.63, name: "São Paulo", admin1: "São Paulo" }]
        })
      })
    );

    const place = await geocodeCityName("São Paulo");
    expect(place).toEqual({
      coords: { latitude: -23.55, longitude: -46.63 },
      cityName: "São Paulo, São Paulo"
    });
  });

  it("monta previsao atual sem depender de geocoding no servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: { temperature_2m: 24.2, weather_code: 2 },
          daily: {
            weather_code: [2],
            temperature_2m_max: [28.1],
            temperature_2m_min: [18.4]
          }
        })
      })
    );

    const forecast = await fetchWeatherForecast({ latitude: -23.55, longitude: -46.63 });
    expect(forecast.temperatureC).toBe(24.2);
    expect(forecast.weatherCode).toBe(2);
    expect(forecast.conditionLabel).toBe("Parcialmente nublado");
    expect(forecast.maxTempC).toBe(28.1);
    expect(forecast.minTempC).toBe(18.4);
    expect("cityName" in forecast).toBe(false);
  });

  it("faz reverse geocode com nome da cidade", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: "Curitiba", admin1: "Paraná" }]
        })
      })
    );

    const city = await reverseGeocodeCity({ latitude: -25.42, longitude: -49.27 });
    expect(city).toBe("Curitiba, Paraná");
  });

  it("usa BigDataCloud quando Open-Meteo falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            city: "Campinas",
            principalSubdivision: "São Paulo"
          })
        })
    );

    const city = await reverseGeocodeCity({ latitude: -22.9, longitude: -47.06 });
    expect(city).toBe("Campinas, São Paulo");
  });

  it("usa rotulo de proximidade quando nenhum geocoder responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const city = await resolveCityNameFromCoords({ latitude: -22.9, longitude: -47.06 });
    expect(city).toBe(NEARBY_WEATHER_LABEL);
  });
});
