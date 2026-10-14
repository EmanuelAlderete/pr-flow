import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpHint } from "@/components/ui/help-hint";
import { PageHeader } from "@/components/layout/page-header";

describe("HelpHint", () => {
  it("shows explanatory copy in a tooltip on focus", async () => {
    render(<HelpHint>Texto de ajuda do widget.</HelpHint>);

    const trigger = screen.getByRole("button", { name: "Mais informações" });
    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByText("Texto de ajuda do widget.")).toBeInTheDocument();
    });
  });
});

describe("PageHeader", () => {
  it("puts description in a help tooltip instead of a subtitle", async () => {
    render(<PageHeader title="Dashboard" description="Resumo do dia." />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("banner").querySelector("p")).toBeNull();

    fireEvent.focus(screen.getByRole("button", { name: "Mais informações" }));

    await waitFor(() => {
      expect(screen.getByText("Resumo do dia.")).toBeInTheDocument();
    });
  });
});
