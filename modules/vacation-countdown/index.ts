export {
  clearVacationCountdown,
  loadVacationCountdown,
  needsVacationSetupPrompt,
  saveVacationCountdown,
  VACATION_COUNTDOWN_STORAGE_KEY,
  VACATION_COUNTDOWN_UPDATED_EVENT
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
export {
  daysUntilVacation,
  vacationCountdownPhase
} from "@/modules/vacation-countdown/lib/vacation-days-until";
export type { VacationCountdownStored } from "@/modules/vacation-countdown/lib/vacation-countdown-validation";
