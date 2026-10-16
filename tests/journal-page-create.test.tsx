import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JournalPage } from "@/modules/journal/components/journal-page";
import { mockJournalFetch, noteFetchCalls } from "@/tests/journal-page-fetch";

vi.mock("@/modules/journal/lib/notebook-day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/journal/lib/notebook-day")>();
  return {
    ...actual,
    todayLocalDateString: () => "2026-05-28"
  };
});

describe("JournalPage create flow", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("creates a note after debounced typing and shows save status", async () => {
    const created = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "## Standup\n\n- shipped journal",
      createdAt: "2026-05-28T12:00:00.000Z",
      updatedAt: "2026-05-28T12:00:00.000Z"
    };

    const fetchMock = mockJournalFetch([
      { body: { note: null } },
      { status: 201, body: created }
    ]);

    render(<JournalPage />);

    await waitFor(() => expect(screen.getByRole("button", { name: /^criar nota$/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^criar nota$/i }));

    fireEvent.change(screen.getByLabelText(/corpo da nota/i), {
      target: { value: "## Standup\n\n- shipped journal" }
    });
    expect(screen.getByRole("status", { name: "Salvando" })).toBeInTheDocument();

    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    vi.useRealTimers();

    await waitFor(() => expect(noteFetchCalls(fetchMock)).toHaveLength(2));
    await waitFor(() =>
      expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("## Standup\n\n- shipped journal")
    );
    expect(screen.queryByRole("status", { name: /empty notebook/i })).not.toBeInTheDocument();
    expect(noteFetchCalls(fetchMock)[1]).toEqual([
      "/api/journal/notes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          notebookDay: "2026-05-28",
          body: "## Standup\n\n- shipped journal"
        })
      })
    ]);
    expect(screen.getByRole("status", { name: "Salvo" })).toBeInTheDocument();
  });
});
