import { CRON_MANUAL_CONFIRMATION_PHRASE } from "@/modules/messages";

export { CRON_MANUAL_CONFIRMATION_PHRASE };

/** Confirmation phrase — must match exactly for manual cron runs. */

export function isCronManualConfirmationValid(input: string): boolean {
  return input === CRON_MANUAL_CONFIRMATION_PHRASE;
}
