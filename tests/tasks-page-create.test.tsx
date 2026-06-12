import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TasksPage } from "@/modules/tasks/components/tasks-page";

describe("TasksPage create flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a task from the open tasks input, clears it, and shows the task in open tasks", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ open: [], completed: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "task-1",
          title: "Ship feature",
          description: null,
          dueDate: null,
          completedAt: null,
          createdAt: "2026-05-28T12:00:00.000Z",
          updatedAt: "2026-05-28T12:00:00.000Z"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          open: [
            {
              id: "task-1",
              title: "Ship feature",
              description: null,
              dueDate: null,
              completedAt: null,
              createdAt: "2026-05-28T12:00:00.000Z",
              updatedAt: "2026-05-28T12:00:00.000Z"
            }
          ],
          completed: []
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<TasksPage />);

    await waitFor(() => expect(screen.getByLabelText(/nova task/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/nova task/i), {
      target: { value: "Ship feature" }
    });
    fireEvent.submit(screen.getByLabelText(/nova task/i).closest("form")!);

    await waitFor(() => expect(screen.getByText("Ship feature")).toBeInTheDocument());
    expect(screen.getByLabelText(/nova task/i)).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
