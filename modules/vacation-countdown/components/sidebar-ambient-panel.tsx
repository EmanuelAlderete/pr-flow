"use client";

import { useEffect, useState } from "react";
import { WeatherForecast } from "@/modules/prs/components/weather-forecast";
import { VacationCountdownSidebar } from "@/modules/vacation-countdown/components/vacation-countdown-sidebar";
import { useVacationCountdown } from "@/modules/vacation-countdown/hooks/use-vacation-countdown";
import { cn } from "@/lib/utils";

const SIDEBAR_AMBIENT_CYCLE_MS = 4500;

/**
 * Sidebar header panel that crossfades between weather and vacation countdown
 * when a vacation start date is configured.
 */
export function SidebarAmbientPanel() {
  const { startDate } = useVacationCountdown();
  const [showVacation, setShowVacation] = useState(false);
  const canRotate = startDate !== null;

  useEffect(() => {
    if (!canRotate) {
      setShowVacation(false);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShowVacation(false);
      return;
    }

    const id = window.setInterval(() => {
      setShowVacation((current) => !current);
    }, SIDEBAR_AMBIENT_CYCLE_MS);

    return () => window.clearInterval(id);
  }, [canRotate]);

  if (!canRotate) {
    return <WeatherForecast variant="sidebar" />;
  }

  return (
    <div className="sidebar-ambient-rotator">
      <div
        className={cn(
          "sidebar-ambient-rotator__panel",
          !showVacation && "sidebar-ambient-rotator__panel--active"
        )}
      >
        <WeatherForecast variant="sidebar" />
      </div>
      <div
        className={cn(
          "sidebar-ambient-rotator__panel",
          showVacation && "sidebar-ambient-rotator__panel--active"
        )}
      >
        <VacationCountdownSidebar />
        <VacationCountdownSidebar iconOnly />
      </div>
    </div>
  );
}
