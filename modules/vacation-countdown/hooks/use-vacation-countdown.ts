"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadVacationCountdown,
  saveVacationCountdown,
  VACATION_COUNTDOWN_UPDATED_EVENT
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
import type { VacationCountdownStored } from "@/modules/vacation-countdown/lib/vacation-countdown-validation";
import {
  daysUntilVacation,
  vacationCountdownPhase,
  type VacationCountdownPhase
} from "@/modules/vacation-countdown/lib/vacation-days-until";

export type VacationCountdownState = {
  startDate: string | null;
  promptDismissed: boolean;
  daysRemaining: number | null;
  phase: VacationCountdownPhase | null;
  needsSetupPrompt: boolean;
  setStartDate: (startDate: string) => void;
  dismissPrompt: () => void;
  clearStartDate: () => void;
};

function derive(settings: VacationCountdownStored) {
  const daysRemaining = settings.startDate === null ? null : daysUntilVacation(settings.startDate);
  return {
    startDate: settings.startDate,
    promptDismissed: settings.promptDismissed,
    daysRemaining,
    phase: daysRemaining === null ? null : vacationCountdownPhase(daysRemaining),
    needsSetupPrompt: settings.startDate === null && !settings.promptDismissed
  };
}

export function useVacationCountdown(): VacationCountdownState {
  const [settings, setSettings] = useState<VacationCountdownStored>({
    startDate: null,
    promptDismissed: false
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(loadVacationCountdown());

    const onUpdate = () => {
      setSettings(loadVacationCountdown());
    };

    window.addEventListener(VACATION_COUNTDOWN_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(VACATION_COUNTDOWN_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const setStartDate = useCallback((startDate: string) => {
    const next = { startDate, promptDismissed: true };
    saveVacationCountdown(next);
    setSettings(next);
  }, []);

  const dismissPrompt = useCallback(() => {
    const next = { startDate: null as string | null, promptDismissed: true };
    saveVacationCountdown(next);
    setSettings(next);
  }, []);

  const clearStartDate = useCallback(() => {
    const next = { startDate: null as string | null, promptDismissed: true };
    saveVacationCountdown(next);
    setSettings(next);
  }, []);

  if (!mounted) {
    return {
      startDate: null,
      promptDismissed: false,
      daysRemaining: null,
      phase: null,
      needsSetupPrompt: false,
      setStartDate,
      dismissPrompt,
      clearStartDate
    };
  }

  return {
    ...derive(settings),
    setStartDate,
    dismissPrompt,
    clearStartDate
  };
}
