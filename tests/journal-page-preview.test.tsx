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

describe("JournalPage preview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens today in edit mode when a note exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          note: {
            id: "note-today",
            notebookDay: "2026-05-28",
            body: "Hoje",
            createdAt: "2026-05-28T12:00:00.000Z",
            updatedAt: "2026-05-28T12:00:00.000Z"
          }
        })
      })
    );

    render(<JournalPage />);

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("Hoje"));
    expect(screen.queryByTestId("note-preview")).not.toBeInTheDocument();
  });

  it("shows preview of current note body and preserves textarea content when returning to edit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ note: null })
      })
    );

    render(<JournalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /^criar nota$/i }));
    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/corpo da nota/i), {
      target: { value: "# Heading\n\n- item" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    expect(screen.getByTestId("note-preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Heading");

    fireEvent.click(screen.getByRole("button", { name: /^editar$/i }));
    expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("# Heading\n\n- item");
  });
});
