import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/journal/day-draft/route";

const generateJournalDayDraft = vi.fn();

vi.mock("@/modules/journal/lib/journal-day-draft-service", () => ({
  generateJournalDayDraft: (...args: unknown[]) => generateJournalDayDraft(...args)
}));

describe("POST /api/journal/day-draft", () => {
  beforeEach(() => {
    generateJournalDayDraft.mockReset();
  });

  it("returns the draft for a notebook day", async () => {
    generateJournalDayDraft.mockResolvedValue({
      status: "ok",
      day: "2026-05-28",
      draft: "## Feito\n- revisei"
    });

    const response = await POST(
      new Request("http://localhost/api/journal/day-draft", {
        method: "POST",
        body: JSON.stringify({ notebookDay: "2026-05-28" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.draft).toContain("## Feito");
    expect(generateJournalDayDraft).toHaveBeenCalledWith("2026-05-28");
  });

  it("rejects an invalid notebook day", async () => {
    const response = await POST(
      new Request("http://localhost/api/journal/day-draft", {
        method: "POST",
        body: JSON.stringify({ notebookDay: "ontem" })
      })
    );

    expect(response.status).toBe(400);
    expect(generateJournalDayDraft).not.toHaveBeenCalled();
  });

  it("returns 422 when the day has nothing to draft", async () => {
    generateJournalDayDraft.mockResolvedValue({
      status: "no_input",
      day: "2026-05-28",
      message: "sem insumo"
    });

    const response = await POST(
      new Request("http://localhost/api/journal/day-draft", {
        method: "POST",
        body: JSON.stringify({ notebookDay: "2026-05-28" })
      })
    );

    expect(response.status).toBe(422);
  });
});
