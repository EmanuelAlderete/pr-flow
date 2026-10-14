import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardDayCalendarWidget } from "@/modules/day-calendar/components/dashboard-day-calendar-widget";

describe("DashboardDayCalendarWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders today's events from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: "ok",
          day: "2026-07-30",
          timeZone: "America/Sao_Paulo",
          events: [
            {
              uid: "a:1",
              title: "Daily Jornada",
              startsAt: "2026-07-30T13:00:00.000Z",
              endsAt: "2026-07-30T13:15:00.000Z",
              allDay: false,
              location: null
            }
          ]
        })
      )
    );

    render(<DashboardDayCalendarWidget />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-day-calendar-widget")).toHaveTextContent(
        "Daily Jornada"
      );
    });
    expect(screen.getByTestId("dashboard-day-calendar-widget")).toHaveTextContent(
      "10:00 – 10:15"
    );
  });

  it("shows empty config guidance when the ICS URL is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            status: "missing_config",
            message:
              "Configure GOOGLE_CALENDAR_ICAL_URL no .env com o endereço secreto do iCal do Google Calendar."
          },
          { status: 503 }
        )
      )
    );

    render(<DashboardDayCalendarWidget />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-day-calendar-widget")).toHaveTextContent(
        "Configure GOOGLE_CALENDAR_ICAL_URL no .env com o endereço secreto do iCal do Google Calendar."
      );
    });
  });
});
