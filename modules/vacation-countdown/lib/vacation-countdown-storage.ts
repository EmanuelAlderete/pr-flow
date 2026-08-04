import {
  vacationCountdownStoredSchema,
  type VacationCountdownStored
} from "@/modules/vacation-countdown/lib/vacation-countdown-validation";

export const VACATION_COUNTDOWN_STORAGE_KEY = "pr-flow:vacation-countdown";
export const VACATION_COUNTDOWN_UPDATED_EVENT = "pr-flow:vacation-countdown-updated";

const EMPTY: VacationCountdownStored = {
  startDate: null,
  promptDismissed: false
};

export function loadVacationCountdown(): VacationCountdownStored {
  if (typeof window === "undefined") {
    return EMPTY;
  }

  try {
    const raw = window.localStorage.getItem(VACATION_COUNTDOWN_STORAGE_KEY);
    if (!raw) {
      return EMPTY;
    }

    const parsed = vacationCountdownStoredSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      return EMPTY;
    }

    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export function saveVacationCountdown(settings: VacationCountdownStored): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VACATION_COUNTDOWN_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event(VACATION_COUNTDOWN_UPDATED_EVENT));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearVacationCountdown(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(VACATION_COUNTDOWN_STORAGE_KEY);
  window.dispatchEvent(new Event(VACATION_COUNTDOWN_UPDATED_EVENT));
}

export function needsVacationSetupPrompt(settings: VacationCountdownStored = loadVacationCountdown()): boolean {
  return settings.startDate === null && !settings.promptDismissed;
}
