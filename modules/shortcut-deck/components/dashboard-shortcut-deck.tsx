"use client";

import { useState } from "react";
import { LayoutGrid, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { Surface } from "@/components/ui/surface";
import { ShortcutDeckManageDialog } from "@/modules/shortcut-deck/components/shortcut-deck-manage-dialog";
import { ShortcutTile } from "@/modules/shortcut-deck/components/shortcut-tile";
import { useShortcutDeck } from "@/modules/shortcut-deck/hooks/use-shortcut-deck";
import { ptBR } from "@/modules/messages/pt-BR";

export function DashboardShortcutDeck() {
  const { shortcuts } = useShortcutDeck();
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <Surface className="flex h-full min-w-0 flex-col space-y-4 p-4" data-testid="dashboard-shortcut-deck">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
            <LayoutGrid className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--app-text)]">
              {ptBR.shortcutDeck.widgetTitle}
            </h2>
            <HelpHint>{ptBR.shortcutDeck.widgetHelp}</HelpHint>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setManageOpen(true)}
          aria-label={ptBR.shortcutDeck.manageAriaLabel}
        >
          <Settings2 className="size-3.5" aria-hidden />
          {shortcuts.length === 0 ? ptBR.shortcutDeck.configure : ptBR.shortcutDeck.manage}
        </Button>
      </div>

      {shortcuts.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)]">{ptBR.shortcutDeck.widgetEmpty}</p>
      ) : (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          role="list"
          aria-label={ptBR.shortcutDeck.deckAriaLabel}
        >
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} role="listitem">
              <ShortcutTile shortcut={shortcut} />
            </div>
          ))}
        </div>
      )}

      <ShortcutDeckManageDialog open={manageOpen} onOpenChange={setManageOpen} />
    </Surface>
  );
}
