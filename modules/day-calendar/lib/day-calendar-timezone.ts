const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export function getDayCalendarTimeZone(
  env: Record<string, string | undefined> = process.env
): string {
  return env.SUMMARY_CRON_TZ?.trim() || DEFAULT_TIME_ZONE;
}

/** Local calendar day `YYYY-MM-DD` in the given IANA time zone. */
export function calendarDayKeyInTimeZone(
  instant: Date,
  timeZone: string
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(instant);
}

/**
 * Inclusive UTC range covering the local calendar day in `timeZone`
 * (from 00:00:00.000 through 23:59:59.999 local).
 */
export function zonedDayUtcRange(
  dayKey: string,
  timeZone: string
): { from: Date; to: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) {
    throw new Error(`Invalid day key: ${dayKey}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const from = zonedLocalToUtc(year, month, day, 0, 0, 0, 0, timeZone);
  // Prefer next local midnight minus 1ms — avoids DST/ms quirks at 23:59:59.999.
  const nextUtc = Date.UTC(year, month - 1, day + 1);
  const next = new Date(nextUtc);
  const fromNext = zonedLocalToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    0,
    0,
    timeZone
  );
  const to = new Date(fromNext.getTime() - 1);
  return { from, to };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const offset1 = getTimeZoneOffsetMs(new Date(guess), timeZone);
  const utc1 = Date.UTC(year, month - 1, day, hour, minute, second, ms) - offset1;
  const offset2 = getTimeZoneOffsetMs(new Date(utc1), timeZone);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, ms) - offset2
  );
}
