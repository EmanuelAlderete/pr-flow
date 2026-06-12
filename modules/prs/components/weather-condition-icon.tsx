import type { LucideIcon } from "lucide-react";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
import {
  weatherCodeToIconKind,
  type WeatherIconKind
} from "@/modules/prs/lib/core/open-meteo-weather";
import { cn } from "@/lib/utils";

const ICON_BY_KIND: Record<WeatherIconKind, LucideIcon> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning
};

interface WeatherConditionIconProps {
  weatherCode: number;
  className?: string;
}

export function WeatherConditionIcon({ weatherCode, className }: WeatherConditionIconProps) {
  const kind = weatherCodeToIconKind(weatherCode);
  const Icon = ICON_BY_KIND[kind];

  return <Icon className={cn("shrink-0", className)} aria-hidden />;
}
