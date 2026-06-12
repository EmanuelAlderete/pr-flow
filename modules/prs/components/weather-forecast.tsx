"use client";

import { useEffect, useState } from "react";
import { useWeatherForecast } from "@/modules/prs/hooks/use-weather-forecast";
import { WeatherConditionIcon } from "@/modules/prs/components/weather-condition-icon";
import { cn } from "@/lib/utils";

type WeatherForecastVariant = "default" | "sidebar";

interface WeatherForecastProps {
  variant?: WeatherForecastVariant;
}

function weatherClassName(variant: WeatherForecastVariant, extra?: string) {
  return cn("weather-forecast", variant === "sidebar" && "weather-forecast--sidebar", extra);
}

function WeatherForecastPlaceholder({ variant }: { variant: WeatherForecastVariant }) {
  return (
    <>
      <aside className={weatherClassName(variant, "group-data-[collapsible=icon]:hidden")} aria-label="Previsão do tempo">
        <p className="weather-forecast__loading small muted">Carregando tempo...</p>
      </aside>
      <aside
        className={cn(
          "weather-forecast weather-forecast--sidebar-icon hidden group-data-[collapsible=icon]:flex"
        )}
        aria-label="Previsão do tempo"
      >
        <span className="weather-forecast__loading-compact" aria-hidden />
      </aside>
    </>
  );
}

interface ForecastViewProps {
  variant: WeatherForecastVariant;
  temperature: number;
  maxTemp: number;
  minTemp: number;
  cityName: string;
  conditionLabel: string;
  weatherCode: number;
}

function WeatherForecastExpanded({
  variant,
  temperature,
  maxTemp,
  minTemp,
  cityName,
  conditionLabel,
  weatherCode
}: ForecastViewProps) {
  const showConditionIcon = variant === "sidebar";

  return (
    <aside
      className={weatherClassName(variant, "group-data-[collapsible=icon]:hidden")}
      aria-label="Previsão do tempo"
    >
      <p className="weather-forecast__city small muted">{cityName}</p>
      <div className="weather-forecast__main">
        <p className="weather-forecast__temp">{temperature}°C</p>
        {showConditionIcon && (
          <WeatherConditionIcon weatherCode={weatherCode} className="weather-forecast__expanded-icon" />
        )}
      </div>
      <p className="weather-forecast__condition small">{conditionLabel}</p>
      <p className="weather-forecast__range small muted">
        mín {minTemp}° · máx {maxTemp}°
      </p>
    </aside>
  );
}

const SIDEBAR_CYCLE_MS = 2500;

function WeatherForecastSidebarIcon({ temperature, conditionLabel, weatherCode }: ForecastViewProps) {
  const [showTemperature, setShowTemperature] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const id = window.setInterval(() => {
      setShowTemperature((current) => !current);
    }, SIDEBAR_CYCLE_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <aside
      className="weather-forecast weather-forecast--sidebar-icon hidden group-data-[collapsible=icon]:flex"
      aria-label={`Previsão: ${temperature}°C, ${conditionLabel}`}
      title={`${temperature}°C · ${conditionLabel}`}
    >
      <div className="weather-forecast__rotator">
        <span
          className={cn(
            "weather-forecast__rotator-item weather-forecast__rotator-temp",
            showTemperature && "weather-forecast__rotator-item--active"
          )}
        >
          {temperature}°
        </span>
        <span
          className={cn(
            "weather-forecast__rotator-item weather-forecast__rotator-icon-wrap",
            !showTemperature && "weather-forecast__rotator-item--active"
          )}
        >
          <WeatherConditionIcon weatherCode={weatherCode} className="weather-forecast__rotator-icon" />
        </span>
      </div>
    </aside>
  );
}

function WeatherForecastContent({ variant }: { variant: WeatherForecastVariant }) {
  const { status, forecast } = useWeatherForecast();

  if (status === "loading") {
    return <WeatherForecastPlaceholder variant={variant} />;
  }

  if (status === "error" || forecast === null) {
    return null;
  }

  const viewProps: ForecastViewProps = {
    variant,
    temperature: Math.round(forecast.temperatureC),
    maxTemp: Math.round(forecast.maxTempC),
    minTemp: Math.round(forecast.minTempC),
    cityName: forecast.cityName,
    conditionLabel: forecast.conditionLabel,
    weatherCode: forecast.weatherCode
  };

  if (variant === "sidebar") {
    return (
      <>
        <WeatherForecastExpanded {...viewProps} />
        <WeatherForecastSidebarIcon {...viewProps} />
      </>
    );
  }

  return <WeatherForecastExpanded {...viewProps} />;
}

export function WeatherForecast({ variant = "default" }: WeatherForecastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <WeatherForecastPlaceholder variant={variant} />;
  }

  return <WeatherForecastContent variant={variant} />;
}
