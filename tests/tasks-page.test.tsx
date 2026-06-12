import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TasksPage } from "@/modules/tasks/components/tasks-page";

describe("TasksPage", () => {
  it("renders two column regions for open tasks and completed tasks", () => {
    render(<TasksPage />);

    expect(screen.getByRole("region", { name: /tarefas abertas/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /tarefas concluídas/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /formulário/i })).not.toBeInTheDocument();
  });

  it("renders a create input inside open tasks", () => {
    render(<TasksPage />);

    expect(screen.getByLabelText(/nova task/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nova task/i)).toBeInTheDocument();
  });
});
