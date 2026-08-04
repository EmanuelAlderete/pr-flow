import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardJournalStreakWidget } from "@/modules/journal/components/dashboard-journal-streak-widget";

describe("DashboardJournalStreakWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders streak count, strip statuses and CTA to today's journal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          currentStreak: 2,
          today: "2026-08-05",
          todayPending: true,
          strip: [
            { notebookDay: "2026-08-03", status: "filled" },
            { notebookDay: "2026-08-04", status: "filled" },
            { notebookDay: "2026-08-05", status: "pending" }
          ]
        })
      )
    );

    render(<DashboardJournalStreakWidget />);

    await waitFor(() => {
      expect(screen.getByTestId("journal-streak-count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("dashboard-journal-streak-widget")).toHaveTextContent(
      "2 dias úteis seguidos"
    );
    expect(screen.getByTestId("journal-streak-strip").querySelectorAll("[data-status]")).toHaveLength(
      3
    );
    expect(screen.getByRole("link", { name: /abrir journal de hoje/i })).toHaveAttribute(
      "href",
      "/journal?day=2026-08-05"
    );
  });

  it("shows empty copy when there is no streak", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          currentStreak: 0,
          today: "2026-08-05",
          todayPending: true,
          strip: [{ notebookDay: "2026-08-05", status: "pending" }]
        })
      )
    );

    render(<DashboardJournalStreakWidget />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-journal-streak-widget")).toHaveTextContent(
        "Nenhum streak ainda — escreva no journal hoje."
      );
    });
  });
});
