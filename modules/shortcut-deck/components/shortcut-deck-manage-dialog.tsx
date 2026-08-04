"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  useShortcutDeck,
  type ShortcutDraft
} from "@/modules/shortcut-deck/hooks/use-shortcut-deck";
import { SHORTCUT_COLOR_TOKENS } from "@/modules/shortcut-deck/lib/shortcut-deck-colors";
import { SHORTCUT_ICON_LABELS, ShortcutIcon } from "@/modules/shortcut-deck/lib/shortcut-deck-icons";
import {
  isValidShortcutUrl,
  SHORTCUT_COLOR_IDS,
  SHORTCUT_DECK_MAX,
  SHORTCUT_ICON_IDS,
  type Shortcut,
  type ShortcutColorId,
  type ShortcutIconId
} from "@/modules/shortcut-deck/lib/shortcut-deck-validation";
import { ptBR } from "@/modules/messages/pt-BR";

type ShortcutDeckManageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_DRAFT: ShortcutDraft = {
  label: "",
  url: "",
  iconId: "link",
  colorId: "ember"
};

export function ShortcutDeckManageDialog({ open, onOpenChange }: ShortcutDeckManageDialogProps) {
  const {
    shortcuts,
    canAdd,
    addShortcut,
    updateShortcut,
    removeShortcut,
    moveShortcutUp,
    moveShortcutDown
  } = useShortcutDeck();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShortcutDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      setFormError(null);
      setShowForm(false);
    }
  }, [open]);

  const editingShortcut = useMemo(
    () => shortcuts.find((s) => s.id === editingId) ?? null,
    [editingId, shortcuts]
  );

  function startCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(shortcut: Shortcut) {
    setEditingId(shortcut.id);
    setDraft({
      label: shortcut.label,
      url: shortcut.url,
      iconId: shortcut.iconId,
      colorId: shortcut.colorId
    });
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(false);
  }

  function submitForm() {
    const label = draft.label.trim();
    const url = draft.url.trim();

    if (!label) {
      setFormError(ptBR.shortcutDeck.labelRequired);
      return;
    }
    if (!url || !isValidShortcutUrl(url)) {
      setFormError(ptBR.shortcutDeck.urlInvalid);
      return;
    }

    if (editingId) {
      updateShortcut(editingId, { ...draft, label, url });
    } else {
      if (!canAdd) {
        setFormError(ptBR.shortcutDeck.maxReached(SHORTCUT_DECK_MAX));
        return;
      }
      addShortcut({ ...draft, label, url });
    }

    cancelForm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100%,calc(100vw-2rem))] max-w-lg overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex min-w-0 items-center gap-2">
            <LayoutGrid className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{ptBR.shortcutDeck.manageTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {ptBR.shortcutDeck.manageDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 overflow-x-hidden">
          {shortcuts.length === 0 && !showForm ? (
            <Surface variant="dashed" className="p-4 text-center text-sm text-[var(--app-text-muted)]">
              {ptBR.shortcutDeck.emptyManage}
            </Surface>
          ) : null}

          {shortcuts.length > 0 ? (
            <ul className="min-w-0 space-y-2" aria-label={ptBR.shortcutDeck.listAriaLabel}>
              {shortcuts.map((shortcut, index) => (
                <li key={shortcut.id} className="min-w-0">
                  <Surface
                    variant="inset"
                    className="flex min-w-0 items-center gap-2 overflow-hidden p-2"
                    data-testid={`shortcut-manage-row-${shortcut.id}`}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-md border"
                      style={{
                        color: SHORTCUT_COLOR_TOKENS[shortcut.colorId].fg,
                        backgroundColor: SHORTCUT_COLOR_TOKENS[shortcut.colorId].bg,
                        borderColor: SHORTCUT_COLOR_TOKENS[shortcut.colorId].border
                      }}
                    >
                      <ShortcutIcon iconId={shortcut.iconId} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-[var(--app-text)]">
                        {shortcut.label}
                      </p>
                      <p className="truncate text-xs text-[var(--app-text-muted)]" title={shortcut.url}>
                        {shortcut.url}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={ptBR.shortcutDeck.moveUp}
                        disabled={index === 0}
                        onClick={() => moveShortcutUp(shortcut.id)}
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={ptBR.shortcutDeck.moveDown}
                        disabled={index === shortcuts.length - 1}
                        onClick={() => moveShortcutDown(shortcut.id)}
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={ptBR.shortcutDeck.edit}
                        onClick={() => startEdit(shortcut)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={ptBR.shortcutDeck.remove}
                        onClick={() => removeShortcut(shortcut.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          ) : null}

          {showForm ? (
            <Surface className="min-w-0 space-y-3 overflow-hidden p-3">
              <p className="text-sm font-medium text-[var(--app-text)]">
                {editingShortcut ? ptBR.shortcutDeck.editFormTitle : ptBR.shortcutDeck.addFormTitle}
              </p>

              <div className="min-w-0 space-y-2">
                <label htmlFor="shortcut-label" className="text-sm text-[var(--app-text)]">
                  {ptBR.shortcutDeck.labelField}
                </label>
                <Input
                  id="shortcut-label"
                  value={draft.label}
                  onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                  placeholder={ptBR.shortcutDeck.labelPlaceholder}
                  maxLength={40}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="shortcut-url" className="text-sm text-[var(--app-text)]">
                  {ptBR.shortcutDeck.urlField}
                </label>
                <Input
                  id="shortcut-url"
                  className="min-w-0"
                  value={draft.url}
                  onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                  placeholder={ptBR.shortcutDeck.urlPlaceholder}
                  maxLength={2000}
                />
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <span className="text-sm text-[var(--app-text)]">{ptBR.shortcutDeck.iconField}</span>
                  <Select
                    value={draft.iconId}
                    onValueChange={(value) => {
                      if (typeof value !== "string" || value.length === 0) {
                        return;
                      }
                      setDraft((d) => ({ ...d, iconId: value as ShortcutIconId }));
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0" aria-label={ptBR.shortcutDeck.iconField}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHORTCUT_ICON_IDS.map((iconId) => (
                        <SelectItem key={iconId} value={iconId}>
                          <span className="flex items-center gap-2">
                            <ShortcutIcon iconId={iconId} className="size-3.5" />
                            {SHORTCUT_ICON_LABELS[iconId]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-2">
                  <span className="text-sm text-[var(--app-text)]">{ptBR.shortcutDeck.colorField}</span>
                  <Select
                    value={draft.colorId}
                    onValueChange={(value) => {
                      if (typeof value !== "string" || value.length === 0) {
                        return;
                      }
                      setDraft((d) => ({ ...d, colorId: value as ShortcutColorId }));
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0" aria-label={ptBR.shortcutDeck.colorField}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHORTCUT_COLOR_IDS.map((colorId) => (
                        <SelectItem key={colorId} value={colorId}>
                          <span className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full border"
                              style={{
                                backgroundColor: SHORTCUT_COLOR_TOKENS[colorId].fg,
                                borderColor: SHORTCUT_COLOR_TOKENS[colorId].border
                              }}
                            />
                            {SHORTCUT_COLOR_TOKENS[colorId].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={cancelForm}>
                  {ptBR.shortcutDeck.cancel}
                </Button>
                <Button type="button" onClick={submitForm}>
                  {editingShortcut ? ptBR.shortcutDeck.save : ptBR.shortcutDeck.add}
                </Button>
              </div>
            </Surface>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!canAdd}
              onClick={startCreate}
            >
              <Plus className="size-4" aria-hidden />
              {canAdd
                ? ptBR.shortcutDeck.addShortcut
                : ptBR.shortcutDeck.maxReached(SHORTCUT_DECK_MAX)}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {ptBR.shortcutDeck.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
