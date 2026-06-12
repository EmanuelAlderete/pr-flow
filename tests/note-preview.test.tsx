import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotePreview } from "@/modules/journal/lib/note-preview";

vi.mock("@/modules/work-context/components/work-context-provider", () => ({
  useWorkContext: () => ({
    openWorkContext: vi.fn()
  })
}));

describe("NotePreview", () => {
  it("does not render executable script tags from unsafe markdown", () => {
    render(<NotePreview markdown={'# Title\n<script>alert("xss")</script>'} />);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });

  it("linkifica JOR-xxx para abrir contexto de trabalho no preview", () => {
    render(<NotePreview markdown="Revisar jor-182 amanhã." />);

    const link = screen.getByRole("button", { name: "JOR-182" });
    expect(link).toHaveAttribute("data-jira-issue-link");
  });
});
