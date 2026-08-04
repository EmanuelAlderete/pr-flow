import { afterEach, describe, expect, it } from "vitest";
import {
  clearShortcutDeck,
  loadShortcutDeck,
  moveShortcut,
  saveShortcutDeck
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";
import type { Shortcut } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

function sc(partial: Partial<Shortcut> & Pick<Shortcut, "id" | "label" | "sortOrder">): Shortcut {
  return {
    url: "https://example.com",
    iconId: "link",
    colorId: "ember",
    ...partial
  };
}

describe("shortcut-deck storage", () => {
  afterEach(() => {
    clearShortcutDeck();
  });

  it("returns empty deck when nothing is stored", () => {
    expect(loadShortcutDeck()).toEqual({ shortcuts: [] });
  });

  it("persists and reloads sorted shortcuts", () => {
    saveShortcutDeck({
      shortcuts: [sc({ id: "b", label: "B", sortOrder: 2 }), sc({ id: "a", label: "A", sortOrder: 1 })]
    });

    expect(loadShortcutDeck().shortcuts.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("ignores invalid stored JSON", () => {
    window.localStorage.setItem("pr-flow:shortcut-deck", "{not-json");
    expect(loadShortcutDeck()).toEqual({ shortcuts: [] });
  });
});

describe("moveShortcut", () => {
  it("swaps sort order with neighbor", () => {
    const shortcuts = [
      sc({ id: "a", label: "A", sortOrder: 0 }),
      sc({ id: "b", label: "B", sortOrder: 1 }),
      sc({ id: "c", label: "C", sortOrder: 2 })
    ];

    const moved = moveShortcut(shortcuts, "b", "up");
    expect(moved.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("no-ops at boundaries", () => {
    const shortcuts = [
      sc({ id: "a", label: "A", sortOrder: 0 }),
      sc({ id: "b", label: "B", sortOrder: 1 })
    ];

    expect(moveShortcut(shortcuts, "a", "up").map((s) => s.id)).toEqual(["a", "b"]);
    expect(moveShortcut(shortcuts, "b", "down").map((s) => s.id)).toEqual(["a", "b"]);
  });
});
