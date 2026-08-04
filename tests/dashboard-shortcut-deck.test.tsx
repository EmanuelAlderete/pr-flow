import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardShortcutDeck } from "@/modules/shortcut-deck/components/dashboard-shortcut-deck";
import {
  clearShortcutDeck,
  saveShortcutDeck
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";

describe("DashboardShortcutDeck", () => {
  afterEach(() => {
    clearShortcutDeck();
  });

  it("shows empty state with configure action", () => {
    render(<DashboardShortcutDeck />);
    expect(screen.getByTestId("dashboard-shortcut-deck")).toHaveTextContent(
      "Adicione links rápidos para ferramentas do dia a dia."
    );
    expect(screen.getByRole("button", { name: /gerenciar deck de atalhos/i })).toBeInTheDocument();
  });

  it("renders configured shortcut tiles", () => {
    saveShortcutDeck({
      shortcuts: [
        {
          id: "slack-1",
          label: "Slack",
          url: "https://app.slack.com",
          iconId: "slack",
          colorId: "sky",
          sortOrder: 0
        }
      ]
    });

    render(<DashboardShortcutDeck />);
    expect(screen.getByTestId("shortcut-tile-slack-1")).toHaveTextContent("Slack");
    expect(screen.getByRole("link", { name: /slack/i })).toHaveAttribute(
      "href",
      "https://app.slack.com"
    );
  });

  it("opens manage dialog from configure button", () => {
    render(<DashboardShortcutDeck />);

    fireEvent.click(screen.getByRole("button", { name: /gerenciar deck de atalhos/i }));
    expect(screen.getByRole("heading", { name: "Deck de atalhos" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum atalho ainda. Adicione o primeiro.")).toBeInTheDocument();
  });
});
