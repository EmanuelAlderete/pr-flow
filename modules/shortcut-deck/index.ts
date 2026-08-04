export { DashboardShortcutDeck } from "@/modules/shortcut-deck/components/dashboard-shortcut-deck";
export { useShortcutDeck } from "@/modules/shortcut-deck/hooks/use-shortcut-deck";
export {
  loadShortcutDeck,
  saveShortcutDeck,
  clearShortcutDeck,
  moveShortcut
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";
export type { Shortcut, ShortcutDeckStored } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";
