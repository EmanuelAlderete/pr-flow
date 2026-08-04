import ical, { type VEvent } from "node-ical";
import type { DayCalendarEvent } from "@/modules/day-calendar/lib/day-calendar-validation";
import { zonedDayUtcRange } from "@/modules/day-calendar/lib/day-calendar-timezone";

function summaryText(value: VEvent["summary"] | unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (
    value &&
    typeof value === "object" &&
    "val" in value &&
    typeof (value as { val: unknown }).val === "string"
  ) {
    return (value as { val: string }).val.trim();
  }
  return "";
}

function locationText(value: VEvent["location"] | unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (
    value &&
    typeof value === "object" &&
    "val" in value &&
    typeof (value as { val: unknown }).val === "string"
  ) {
    const trimmed = (value as { val: string }).val.trim();
    return trimmed || null;
  }
  return null;
}

function isCancelled(status: unknown): boolean {
  return typeof status === "string" && status.toUpperCase() === "CANCELLED";
}

function overlapsRange(
  start: Date,
  end: Date,
  from: Date,
  to: Date
): boolean {
  return start.getTime() <= to.getTime() && end.getTime() >= from.getTime();
}

function toEventDto(input: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
}): DayCalendarEvent | null {
  const title = input.title.trim();
  if (!title) {
    return null;
  }

  return {
    uid: input.uid,
    title,
    startsAt: input.start.toISOString(),
    endsAt: input.end.toISOString(),
    allDay: input.allDay,
    location: input.location
  };
}

/**
 * Parse ICS text and return events that overlap the local calendar day.
 * Recurring masters are expanded via node-ical; RECURRENCE-ID overrides apply.
 */
export function listDayEventsFromIcs(
  icsText: string,
  dayKey: string,
  timeZone: string
): DayCalendarEvent[] {
  const { from, to } = zonedDayUtcRange(dayKey, timeZone);
  const parsed = ical.sync.parseICS(icsText);
  const events = Object.values(parsed).filter(
    (entry): entry is VEvent =>
      entry !== undefined &&
      typeof entry === "object" &&
      "type" in entry &&
      entry.type === "VEVENT"
  );

  const collected: DayCalendarEvent[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (isCancelled(event.status)) {
      continue;
    }

    // Overrides are applied while expanding the master; skip orphans here.
    if (event.recurrenceid && !event.rrule) {
      continue;
    }

    if (event.rrule) {
      const instances = ical.expandRecurringEvent(event, {
        from,
        to,
        expandOngoing: true,
        includeOverrides: true,
        excludeExdates: true
      });

      for (const instance of instances) {
        if (isCancelled(instance.event.status)) {
          continue;
        }
        const start = instance.start;
        const end = instance.end ?? instance.start;
        if (!overlapsRange(start, end, from, to)) {
          continue;
        }
        const dto = toEventDto({
          uid: `${event.uid}:${start.toISOString()}`,
          title: summaryText(instance.summary ?? event.summary),
          start,
          end,
          allDay: Boolean(instance.isFullDay),
          location: locationText(instance.event.location ?? event.location)
        });
        if (!dto || seen.has(dto.uid)) {
          continue;
        }
        seen.add(dto.uid);
        collected.push(dto);
      }
      continue;
    }

    if (!event.start) {
      continue;
    }

    const start = event.start;
    const end = event.end ?? event.start;
    if (!overlapsRange(start, end, from, to)) {
      continue;
    }

    const dto = toEventDto({
      uid: `${event.uid}:${start.toISOString()}`,
      title: summaryText(event.summary),
      start,
      end,
      allDay: event.datetype === "date",
      location: locationText(event.location)
    });
    if (!dto || seen.has(dto.uid)) {
      continue;
    }
    seen.add(dto.uid);
    collected.push(dto);
  }

  collected.sort((a, b) => {
    if (a.allDay !== b.allDay) {
      return a.allDay ? -1 : 1;
    }
    return a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title);
  });

  return collected;
}
