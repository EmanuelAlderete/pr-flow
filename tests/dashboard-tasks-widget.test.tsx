import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardTasksWidget } from "@/modules/dashboard/components/dashboard-tasks-widget";

describe("DashboardTasksWidget", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lista tarefas abertas e conclui ao marcar checkbox", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          open: [
            {
              id: "t1",
              title: "Revisar PR",
              description: null,
              dueDate: "2026-06-05",
              completedAt: null,
              createdAt: "2026-06-01T10:00:00.000Z",
              updatedAt: "2026-06-01T10:00:00.000Z",
              isOverdue: true
            }
          ],
          completed: []
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ open: [], completed: [] })
      } as Response);

    render(<DashboardTasksWidget />);

    await waitFor(() => {
      expect(screen.getByText("Revisar PR")).toBeInTheDocument();
    });

    expect(screen.getByText("Atrasada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver todas/i })).toHaveAttribute("href", "/tasks");

    fireEvent.click(screen.getByRole("checkbox", { name: /concluir revisar pr/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tasks/t1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ action: "complete" })
        })
      );
    });
  });

  it("mostra estado vazio quando não há tarefas", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ open: [], completed: [] })
    } as Response);

    render(<DashboardTasksWidget />);

    await waitFor(() => {
      expect(screen.getByText(/lista vazia por agora/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /criar tarefa/i })).toHaveAttribute("href", "/tasks");
  });
});
