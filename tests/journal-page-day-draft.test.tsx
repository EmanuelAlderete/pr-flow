import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { JournalPage } from "@/modules/journal/components/journal-page";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

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

const draft = "## Feito\n- revisei a fila\n\n## Entregue\n- merge do journal\n\n## Perguntas\n- O que travou?\n>";

describe("JournalPage day draft", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fills an empty notebook with generated notes", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/journal/day-draft")) {
        return {
          ok: true,
          json: async () => ({ status: "ok", day: "2026-05-28", draft })
        };
      }
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as { body: string };
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: "note-1",
            notebookDay: "2026-05-28",
            body: body.body,
            createdAt: "2026-05-28T12:00:00.000Z",
            updatedAt: "2026-05-28T12:00:00.000Z"
          })
        };
      }
      return { ok: true, json: async () => ({ note: null }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<JournalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /gerar anotações do dia/i }));

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue(draft));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/journal/day-draft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ notebookDay: "2026-05-28" })
      })
    );
  });

  it("appends the draft below an existing note", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/journal/day-draft")) {
          return {
            ok: true,
            json: async () => ({ status: "ok", day: "2026-05-28", draft })
          };
        }
        if (init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as { body: string };
          return {
            ok: true,
            json: async () => ({
              id: "note-1",
              notebookDay: "2026-05-28",
              body: body.body,
              createdAt: "2026-05-28T11:00:00.000Z",
              updatedAt: "2026-05-28T12:00:00.000Z"
            })
          };
        }
        return {
          ok: true,
          json: async () => ({
            note: {
              id: "note-1",
              notebookDay: "2026-05-28",
              body: "Standup da manhã",
              createdAt: "2026-05-28T11:00:00.000Z",
              updatedAt: "2026-05-28T11:00:00.000Z"
            }
          })
        };
      })
    );

    render(<JournalPage />);

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue("Standup da manhã"));
    fireEvent.click(screen.getByRole("button", { name: /gerar anotações do dia/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue(`Standup da manhã\n\n${draft}`)
    );
  });

  it("updates the note that already exists instead of showing a conflict", async () => {
    vi.mocked(toast.error).mockClear();
    const existing = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "Standup da manhã",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T11:00:00.000Z"
    };
    const merged = `Standup da manhã\n\n${draft}`;
    let noteReads = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/journal/day-draft")) {
          return {
            ok: true,
            json: async () => ({ status: "ok", day: "2026-05-28", draft })
          };
        }
        if (init?.method === "POST") {
          return {
            ok: false,
            status: 409,
            json: async () => ({ error: "Já existe uma Note ativa para este Notebook day." })
          };
        }
        if (init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as { body: string };
          return {
            ok: true,
            json: async () => ({ ...existing, body: body.body })
          };
        }
        noteReads += 1;
        return {
          ok: true,
          json: async () => ({ note: noteReads === 1 ? null : existing })
        };
      })
    );

    render(<JournalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /gerar anotações do dia/i }));

    await waitFor(() => expect(screen.getByLabelText(/corpo da nota/i)).toHaveValue(merged), {
      timeout: 3000
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
