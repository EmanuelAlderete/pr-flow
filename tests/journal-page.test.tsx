import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { JournalPage } from "@/modules/journal/components/journal-page";

vi.mock("@/modules/journal/lib/notebook-day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/journal/lib/notebook-day")>();
  return {
    ...actual,
    todayLocalDateString: () => "2026-05-28"
  };
});

describe("JournalPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ note: null })
      })
    );
  });

  it("opens on Today with empty notebook and create before showing the editor", async () => {
    render(<JournalPage />);

    expect(await screen.findByRole("button", { name: /dia do caderno/i })).toHaveAttribute(
      "data-notebook-day",
      "2026-05-28"
    );
    expect(screen.getByRole("status", { name: /caderno vazio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^criar nota$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/corpo da nota/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^remove$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^criar nota$/i }));

    expect(screen.queryByRole("status", { name: /caderno vazio/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/corpo da nota/i)).toBeInTheDocument();
  });
});
