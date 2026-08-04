import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JournalPage } from "@/modules/journal/components/journal-page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/modules/journal/lib/notebook-day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/journal/lib/notebook-day")>();
  return {
    ...actual,
    todayLocalDateString: () => "2026-05-28"
  };
});

describe("JournalPage edit flow", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows saved status for an existing note and saving while editing", async () => {
    const existing = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "Original",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T11:00:00.000Z"
    };
    const updated = {
      ...existing,
      body: "Updated standup",
      updatedAt: "2026-05-28T12:00:00.000Z"
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ note: existing })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updated
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<JournalPage />);

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("Original"));
    expect(screen.getByRole("status", { name: "Salvo" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/corpo da nota/i), {
      target: { value: "Updated standup" }
    });
    expect(screen.getByRole("status", { name: "Salvando" })).toBeInTheDocument();

    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    vi.useRealTimers();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("Updated standup")
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/journal/notes/note-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ body: "Updated standup" })
      })
    );
    expect(screen.getByRole("status", { name: "Salvo" })).toBeInTheDocument();
  });

  it("preserves trailing whitespace in the editor after autosave", async () => {
    const existing = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "Hello",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T11:00:00.000Z"
    };
    const withTrailingSpace = "Hello ";
    const updated = {
      ...existing,
      body: withTrailingSpace,
      updatedAt: "2026-05-28T12:00:00.000Z"
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ note: existing })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updated
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<JournalPage />);

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("Hello"));

    fireEvent.change(screen.getByLabelText(/corpo da nota/i), {
      target: { value: withTrailingSpace }
    });

    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    vi.useRealTimers();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/journal/notes/note-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ body: withTrailingSpace })
      })
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue(withTrailingSpace)
    );
  });
});
