export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherForecast {
  cityName: string;
  temperatureC: number;
  weatherCode: number;
  conditionLabel: string;
  maxTempC: number;
  minTempC: number;
}

export interface WeatherReading {
  temperatureC: number;
  weatherCode: number;
  conditionLabel: string;
  maxTempC: number;
  minTempC: number;
}

export interface GeocodedPlace {
  coords: Coordinates;
  cityName: string;
}

export const NEARBY_WEATHER_LABEL = "Sua localização";

export type WeatherIconKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

export function weatherCodeToIconKind(code: number): WeatherIconKind {
  if (code === 0 || code === 1) {
    return "clear";
  }
  if (code === 2) {
    return "partly-cloudy";
  }
  if (code === 3) {
    return "cloudy";
  }
  if (code === 45 || code === 48) {
    return "fog";
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "rain";
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return "snow";
  }
  if (code >= 95) {
    return "storm";
  }
  return "cloudy";
}

const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_REVERSE = "https://geocoding-api.open-meteo.com/v1/reverse";
const BIGDATACLOUD_REVERSE = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function formatPlaceName(name: string, admin1?: string): string {
  return admin1 ? `${name}, ${admin1}` : name;
}

export function describeWeatherCode(code: number): string {
  if (code === 0) {
    return "Céu limpo";
  }
  if (code === 1) {
    return "Predominantemente limpo";
  }
  if (code === 2) {
    return "Parcialmente nublado";
  }
  if (code === 3) {
    return "Nublado";
  }
  if (code === 45 || code === 48) {
    return "Neblina";
  }
  if (code >= 51 && code <= 57) {
    return "Garoa";
  }
  if (code >= 61 && code <= 67) {
    return "Chuva";
  }
  if (code >= 71 && code <= 77) {
    return "Neve";
  }
  if (code >= 80 && code <= 82) {
    return "Pancadas de chuva";
  }
  if (code >= 85 && code <= 86) {
    return "Pancadas de neve";
  }
  if (code === 95) {
    return "Tempestade";
  }
  if (code >= 96 && code <= 99) {
    return "Tempestade com granizo";
  }
  return "Condição indefinida";
}

export async function geocodeCityName(cityName: string): Promise<GeocodedPlace | null> {
  const url = new URL(OPEN_METEO_GEOCODE);
  url.searchParams.set("name", cityName);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      results?: Array<{ latitude?: number; longitude?: number; name?: string; admin1?: string }>;
    };

    const match = payload.results?.[0];
    if (typeof match?.latitude !== "number" || typeof match?.longitude !== "number" || !match.name) {
      return null;
    }

    return {
      coords: { latitude: match.latitude, longitude: match.longitude },
      cityName: formatPlaceName(match.name, match.admin1)
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeWithOpenMeteo(coords: Coordinates): Promise<string | null> {
  const url = new URL(OPEN_METEO_REVERSE);
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      results?: Array<{ name?: string; admin1?: string }>;
    };

    const place = payload.results?.[0];
    if (!place?.name) {
      return null;
    }

    return formatPlaceName(place.name, place.admin1);
  } catch {
    return null;
  }
}

async function reverseGeocodeWithBigDataCloud(coords: Coordinates): Promise<string | null> {
  const url = new URL(BIGDATACLOUD_REVERSE);
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("localityLanguage", "pt");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };

    const city = payload.city || payload.locality;
    if (!city) {
      return null;
    }

    return formatPlaceName(city, payload.principalSubdivision);
  } catch {
    return null;
  }
}

export async function reverseGeocodeCity(coords: Coordinates): Promise<string | null> {
  return (await reverseGeocodeWithOpenMeteo(coords)) ?? (await reverseGeocodeWithBigDataCloud(coords));
}

export async function resolveCityNameFromCoords(coords: Coordinates): Promise<string> {
  return (await reverseGeocodeCity(coords)) ?? NEARBY_WEATHER_LABEL;
}

export async function fetchWeatherForecast(coords: Coordinates): Promise<WeatherReading> {
  const url = new URL(OPEN_METEO_FORECAST);
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondeu com HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: {
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
  };

  const temperatureC = payload.current?.temperature_2m;
  const weatherCode = payload.current?.weather_code ?? payload.daily?.weather_code?.[0];
  const maxTempC = payload.daily?.temperature_2m_max?.[0];
  const minTempC = payload.daily?.temperature_2m_min?.[0];

  if (typeof temperatureC !== "number" || typeof weatherCode !== "number") {
    throw new Error("Resposta de tempo incompleta");
  }
  if (typeof maxTempC !== "number" || typeof minTempC !== "number") {
    throw new Error("Resposta de tempo incompleta");
  }

  return {
    temperatureC,
    weatherCode,
    conditionLabel: describeWeatherCode(weatherCode),
    maxTempC,
    minTempC
  };
}

export function getDefaultWeatherCity(): string {
  return process.env.NEXT_PUBLIC_WEATHER_CITY?.trim() || "São Paulo";
}
