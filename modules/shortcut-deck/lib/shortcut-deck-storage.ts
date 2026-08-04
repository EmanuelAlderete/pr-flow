import {
  shortcutDeckStoredSchema,
  sortShortcuts,
  type Shortcut,
  type ShortcutDeckStored
} from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

export const SHORTCUT_DECK_STORAGE_KEY = "pr-flow:shortcut-deck";
export const SHORTCUT_DECK_UPDATED_EVENT = "pr-flow:shortcut-deck-updated";

const EMPTY: ShortcutDeckStored = { shortcuts: [] };

export function loadShortcutDeck(): ShortcutDeckStored {
  if (typeof window === "undefined") {
    return EMPTY;
  }

  try {
    const raw = window.localStorage.getItem(SHORTCUT_DECK_STORAGE_KEY);
    if (!raw) {
      return EMPTY;
    }

    const parsed = shortcutDeckStoredSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      return EMPTY;
    }

    return { shortcuts: sortShortcuts(parsed.data.shortcuts) };
  } catch {
    return EMPTY;
  }
}

export function saveShortcutDeck(deck: ShortcutDeckStored): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized: ShortcutDeckStored = {
      shortcuts: sortShortcuts(deck.shortcuts)
    };
    window.localStorage.setItem(SHORTCUT_DECK_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(SHORTCUT_DECK_UPDATED_EVENT));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearShortcutDeck(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SHORTCUT_DECK_STORAGE_KEY);
  window.dispatchEvent(new Event(SHORTCUT_DECK_UPDATED_EVENT));
}

export function createShortcutId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextSortOrder(shortcuts: readonly Shortcut[]): number {
  if (shortcuts.length === 0) {
    return 0;
  }
  return Math.max(...shortcuts.map((s) => s.sortOrder)) + 1;
}

export function moveShortcut(
  shortcuts: readonly Shortcut[],
  id: string,
  direction: "up" | "down"
): Shortcut[] {
  const ordered = sortShortcuts(shortcuts);
  const index = ordered.findIndex((s) => s.id === id);
  if (index < 0) {
    return ordered;
  }

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ordered.length) {
    return ordered;
  }

  const next = [...ordered];
  const currentOrder = next[index].sortOrder;
  const otherOrder = next[swapWith].sortOrder;
  next[index] = { ...next[index], sortOrder: otherOrder };
  next[swapWith] = { ...next[swapWith], sortOrder: currentOrder };

  // If orders were equal, force distinct positions via reindex.
  if (currentOrder === otherOrder) {
    return reindexSortOrders(swapElements(ordered, index, swapWith));
  }

  return sortShortcuts(next);
}

function swapElements<T>(items: readonly T[], a: number, b: number): T[] {
  const next = [...items];
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

export function reindexSortOrders(shortcuts: readonly Shortcut[]): Shortcut[] {
  return shortcuts.map((shortcut, index) => ({ ...shortcut, sortOrder: index }));
}
