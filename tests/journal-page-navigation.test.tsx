import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JournalPage } from "@/modules/journal/components/journal-page";

vi.mock("@/modules/journal/lib/notebook-day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/journal/lib/notebook-day")>();
  return {
    ...actual,
    todayLocalDateString: () => "2026-05-28"
  };
});

describe("JournalPage notebook navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the note for the navigated notebook day", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ note: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          note: {
            id: "note-1",
            notebookDay: "2026-05-27",
            body: "Yesterday",
            createdAt: "2026-05-27T12:00:00.000Z",
            updatedAt: "2026-05-27T12:00:00.000Z"
          }
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<JournalPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /dia do caderno/i })).toHaveAttribute(
        "data-notebook-day",
        "2026-05-28"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /dia anterior/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /dia do caderno/i })).toHaveAttribute(
        "data-notebook-day",
        "2026-05-27"
      )
    );
    await waitFor(() => expect(screen.getByTestId("note-preview")).toBeInTheDocument());
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(screen.queryByLabelText(/corpo da nota/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/journal/notes?notebookDay=2026-05-27");
  });
});
