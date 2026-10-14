import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickNoteDialog } from "@/components/quick-note/quick-note-dialog";
import { TASKS_UPDATED_EVENT } from "@/modules/tasks/lib/task-events";

describe("QuickNoteDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens on Ctrl+Space and submits with Ctrl+Enter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        routedBy: "ai",
        note: {
          id: "note-1",
          notebookDay: "2026-05-29",
          body: "### quick-note (29/05/2026, 14:30):\nIdeia",
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-29T14:30:00.000Z"
        },
        tasks: []
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<QuickNoteDialog />);

    fireEvent.keyDown(window, { key: " ", code: "Space", ctrlKey: true });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/texto da nota rápida/i), {
      target: { value: "Ideia" }
    });
    fireEvent.keyDown(screen.getByLabelText(/texto da nota rápida/i), {
      key: "Enter",
      ctrlKey: true
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/journal/quick-note",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Ideia" })
      })
    );
  });

  it("dispatches tasks-updated event when tasks were created", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        routedBy: "ai",
        note: {
          id: "note-1",
          notebookDay: "2026-05-29",
          body: "### quick-note:\nrevisar pr",
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-29T12:00:00.000Z"
        },
        tasks: [
          {
            id: "task-1",
            title: "Revisar PR",
            description: null,
            dueDate: null,
            completedAt: null,
            createdAt: "2026-05-29T12:00:00.000Z",
            updatedAt: "2026-05-29T12:00:00.000Z"
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<QuickNoteDialog />);

    fireEvent.keyDown(window, { key: " ", code: "Space", ctrlKey: true });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/texto da nota rápida/i), {
      target: { value: "revisar pr" }
    });
    fireEvent.keyDown(screen.getByLabelText(/texto da nota rápida/i), {
      key: "Enter",
      ctrlKey: true
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: TASKS_UPDATED_EVENT }));
  });
});
