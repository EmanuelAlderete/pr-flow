import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listDayEventsFromIcs } from "@/modules/day-calendar/lib/day-calendar-parse";
import {
  clearDayCalendarIcsCache,
  getDayCalendar
} from "@/modules/day-calendar/lib/day-calendar-service";
import {
  calendarDayKeyInTimeZone,
  zonedDayUtcRange
} from "@/modules/day-calendar/lib/day-calendar-timezone";
import { formatDayCalendarTimeRange } from "@/modules/day-calendar/lib/day-calendar-labels";
import { dayCalendarIcalUrlSchema } from "@/modules/day-calendar/lib/day-calendar-validation";

const FIXTURE = readFileSync(
  join(process.cwd(), "tests/fixtures/day-calendar-sample.ics"),
  "utf8"
);

describe("day-calendar timezone", () => {
  it("formats the local day key in America/Sao_Paulo", () => {
    const instant = new Date("2026-07-30T02:30:00.000Z");
    expect(calendarDayKeyInTimeZone(instant, "America/Sao_Paulo")).toBe("2026-07-29");
    expect(calendarDayKeyInTimeZone(new Date("2026-07-30T03:00:00.000Z"), "America/Sao_Paulo")).toBe(
      "2026-07-30"
    );
  });

  it("builds a UTC range covering the local day", () => {
    const { from, to } = zonedDayUtcRange("2026-07-30", "America/Sao_Paulo");
    expect(from.toISOString()).toBe("2026-07-30T03:00:00.000Z");
    expect(to.toISOString()).toBe("2026-07-31T02:59:59.999Z");
  });
});

describe("day-calendar parse", () => {
  it("lists timed, all-day and recurring events for the day and skips cancelled", () => {
    const events = listDayEventsFromIcs(FIXTURE, "2026-07-30", "America/Sao_Paulo");
    expect(events.map((event) => event.title)).toEqual([
      "Feriado interno",
      "Daily Jornada",
      "Almoço"
    ]);
    expect(events[0]?.allDay).toBe(true);
    expect(events[1]?.location).toBe("Meet");
    expect(events.some((event) => event.title === "Cancelado")).toBe(false);
    expect(events.some((event) => event.title === "Amanhã")).toBe(false);
  });
});

describe("day-calendar labels", () => {
  it("formats timed ranges and all-day label in pt-BR", () => {
    expect(
      formatDayCalendarTimeRange(
        "2026-07-30T13:00:00.000Z",
        "2026-07-30T13:15:00.000Z",
        false,
        "America/Sao_Paulo"
      )
    ).toBe("10:00 – 10:15");
    expect(
      formatDayCalendarTimeRange(
        "2026-07-30T03:00:00.000Z",
        "2026-07-31T03:00:00.000Z",
        true,
        "America/Sao_Paulo"
      )
    ).toBe("Dia todo");
  });
});

describe("day-calendar validation", () => {
  it("accepts only https Google Calendar private ICS URLs", () => {
    expect(
      dayCalendarIcalUrlSchema.safeParse(
        "https://calendar.google.com/calendar/ical/user%40example.com/private-abc/basic.ics"
      ).success
    ).toBe(true);
    expect(dayCalendarIcalUrlSchema.safeParse("http://calendar.google.com/x").success).toBe(
      false
    );
    expect(dayCalendarIcalUrlSchema.safeParse("https://evil.example/cal.ics").success).toBe(
      false
    );
  });
});

describe("day-calendar service", () => {
  afterEach(() => {
    clearDayCalendarIcsCache();
  });

  it("returns missing_config when the env URL is absent", async () => {
    const result = await getDayCalendar(undefined, {
      env: {},
      now: new Date("2026-07-30T15:00:00.000Z")
    });
    expect(result.status).toBe("missing_config");
  });

  it("returns today's events from a fetched ICS feed", async () => {
    const result = await getDayCalendar("2026-07-30", {
      env: {
        GOOGLE_CALENDAR_ICAL_URL:
          "https://calendar.google.com/calendar/ical/user%40example.com/private-abc/basic.ics",
        SUMMARY_CRON_TZ: "America/Sao_Paulo"
      },
      fetchIcs: async () => FIXTURE
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.day).toBe("2026-07-30");
    expect(result.events.map((event) => event.title)).toEqual([
      "Feriado interno",
      "Daily Jornada",
      "Almoço"
    ]);
  });

  it("reuses the in-memory ICS cache within the TTL", async () => {
    let fetches = 0;
    const env = {
      GOOGLE_CALENDAR_ICAL_URL:
        "https://calendar.google.com/calendar/ical/user%40example.com/private-abc/basic.ics"
    };
    const fetchIcs = async () => {
      fetches += 1;
      return FIXTURE;
    };

    await getDayCalendar("2026-07-30", { env, fetchIcs });
    await getDayCalendar("2026-07-30", { env, fetchIcs });
    expect(fetches).toBe(1);
  });

  it("downloads ICS over IPv4 https and follows a redirect", async () => {
    const { createServer } = await import("node:http");
    const { fetchIcsOverHttps } = await import(
      "@/modules/day-calendar/lib/day-calendar-service"
    );

    const server = createServer((req, res) => {
      if (req.url === "/redirect") {
        res.writeHead(302, { Location: "/final.ics" });
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/calendar" });
      res.end(FIXTURE);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("expected TCP address");
    }

    try {
      const body = await fetchIcsOverHttps(
        `http://127.0.0.1:${address.port}/redirect`
      );
      expect(body).toContain("BEGIN:VCALENDAR");
      expect(body).toContain("Daily Jornada");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
