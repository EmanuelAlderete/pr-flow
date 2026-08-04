import { dayCalendarIcalUrlSchema } from "@/modules/day-calendar/lib/day-calendar-validation";

export function getGoogleCalendarIcalUrl(
  env: Record<string, string | undefined> = process.env
): string | null {
  const raw = env.GOOGLE_CALENDAR_ICAL_URL?.trim();
  if (!raw) {
    return null;
  }

  const parsed = dayCalendarIcalUrlSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function isGoogleCalendarIcalConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return Boolean(getGoogleCalendarIcalUrl(env));
}
