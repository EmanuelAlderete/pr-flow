"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useVacationCountdown } from "@/modules/vacation-countdown/hooks/use-vacation-countdown";
import { loadVacationCountdown } from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
import { ptBR } from "@/modules/messages/pt-BR";

type VacationSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string | null;
  mode?: "setup" | "edit";
};

export function VacationSetupDialog({
  open,
  onOpenChange,
  initialDate = null,
  mode = "setup"
}: VacationSetupDialogProps) {
  const { setStartDate, dismissPrompt } = useVacationCountdown();
  const [draft, setDraft] = useState(initialDate ?? "");

  useEffect(() => {
    if (open) {
      setDraft(initialDate ?? "");
    }
  }, [initialDate, open]);

  const canSave = draft.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="size-5 text-primary" aria-hidden />
            {mode === "edit" ? ptBR.vacation.editTitle : ptBR.vacation.setupTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? ptBR.vacation.editDescription : ptBR.vacation.setupDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="vacation-start-date" className="text-sm font-medium text-[var(--app-text)]">
            {ptBR.vacation.dateLabel}
          </label>
          <DatePicker
            id="vacation-start-date"
            value={draft}
            onChange={setDraft}
            placeholder={ptBR.vacation.datePlaceholder}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {mode === "setup" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                dismissPrompt();
                onOpenChange(false);
              }}
            >
              {ptBR.vacation.skip}
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {ptBR.vacation.cancel}
            </Button>
          )}
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) {
                return;
              }
              setStartDate(draft);
              onOpenChange(false);
            }}
          >
            {ptBR.vacation.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Opens the setup dialog once on first visit when no date is stored. */
export function VacationCountdownBootstrap() {
  const { needsSetupPrompt, startDate, dismissPrompt } = useVacationCountdown();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (needsSetupPrompt) {
      setOpen(true);
    }
  }, [needsSetupPrompt]);

  return (
    <VacationSetupDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          const current = loadVacationCountdown();
          if (current.startDate === null && !current.promptDismissed) {
            dismissPrompt();
          }
        }
        setOpen(next);
      }}
      initialDate={startDate}
      mode="setup"
    />
  );
}
