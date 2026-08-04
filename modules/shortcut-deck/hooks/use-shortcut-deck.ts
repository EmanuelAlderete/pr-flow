"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearShortcutDeck,
  loadShortcutDeck,
  moveShortcut,
  nextSortOrder,
  reindexSortOrders,
  saveShortcutDeck,
  SHORTCUT_DECK_UPDATED_EVENT,
  createShortcutId
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";
import {
  SHORTCUT_DECK_MAX,
  sortShortcuts,
  type Shortcut,
  type ShortcutColorId,
  type ShortcutDeckStored,
  type ShortcutIconId
} from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

export type ShortcutDraft = {
  label: string;
  url: string;
  iconId: ShortcutIconId;
  colorId: ShortcutColorId;
};

export type ShortcutDeckState = {
  shortcuts: Shortcut[];
  canAdd: boolean;
  addShortcut: (draft: ShortcutDraft) => Shortcut | null;
  updateShortcut: (id: string, draft: ShortcutDraft) => boolean;
  removeShortcut: (id: string) => void;
  moveShortcutUp: (id: string) => void;
  moveShortcutDown: (id: string) => void;
  replaceAll: (shortcuts: Shortcut[]) => void;
  clearAll: () => void;
};

const EMPTY: ShortcutDeckStored = { shortcuts: [] };

export function useShortcutDeck(): ShortcutDeckState {
  const [deck, setDeck] = useState<ShortcutDeckStored>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDeck(loadShortcutDeck());

    const onUpdate = () => {
      setDeck(loadShortcutDeck());
    };

    window.addEventListener(SHORTCUT_DECK_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(SHORTCUT_DECK_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const persist = useCallback((next: ShortcutDeckStored) => {
    const normalized = { shortcuts: sortShortcuts(next.shortcuts) };
    saveShortcutDeck(normalized);
    setDeck(normalized);
  }, []);

  const addShortcut = useCallback(
    (draft: ShortcutDraft): Shortcut | null => {
      const current = loadShortcutDeck();
      if (current.shortcuts.length >= SHORTCUT_DECK_MAX) {
        return null;
      }

      const shortcut: Shortcut = {
        id: createShortcutId(),
        label: draft.label.trim(),
        url: draft.url.trim(),
        iconId: draft.iconId,
        colorId: draft.colorId,
        sortOrder: nextSortOrder(current.shortcuts)
      };

      persist({ shortcuts: [...current.shortcuts, shortcut] });
      return shortcut;
    },
    [persist]
  );

  const updateShortcut = useCallback(
    (id: string, draft: ShortcutDraft): boolean => {
      const current = loadShortcutDeck();
      const index = current.shortcuts.findIndex((s) => s.id === id);
      if (index < 0) {
        return false;
      }

      const next = [...current.shortcuts];
      next[index] = {
        ...next[index],
        label: draft.label.trim(),
        url: draft.url.trim(),
        iconId: draft.iconId,
        colorId: draft.colorId
      };
      persist({ shortcuts: next });
      return true;
    },
    [persist]
  );

  const removeShortcut = useCallback(
    (id: string) => {
      const current = loadShortcutDeck();
      persist({
        shortcuts: reindexSortOrders(current.shortcuts.filter((s) => s.id !== id))
      });
    },
    [persist]
  );

  const moveShortcutUp = useCallback(
    (id: string) => {
      const current = loadShortcutDeck();
      persist({ shortcuts: moveShortcut(current.shortcuts, id, "up") });
    },
    [persist]
  );

  const moveShortcutDown = useCallback(
    (id: string) => {
      const current = loadShortcutDeck();
      persist({ shortcuts: moveShortcut(current.shortcuts, id, "down") });
    },
    [persist]
  );

  const replaceAll = useCallback(
    (shortcuts: Shortcut[]) => {
      persist({ shortcuts: reindexSortOrders(sortShortcuts(shortcuts)) });
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    clearShortcutDeck();
    setDeck(EMPTY);
  }, []);

  if (!mounted) {
    return {
      shortcuts: [],
      canAdd: true,
      addShortcut,
      updateShortcut,
      removeShortcut,
      moveShortcutUp,
      moveShortcutDown,
      replaceAll,
      clearAll
    };
  }

  return {
    shortcuts: deck.shortcuts,
    canAdd: deck.shortcuts.length < SHORTCUT_DECK_MAX,
    addShortcut,
    updateShortcut,
    removeShortcut,
    moveShortcutUp,
    moveShortcutDown,
    replaceAll,
    clearAll
  };
}
