"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  channel: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PrSlackReshareDialog({ open, channel, loading, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar novamente ao Slack?</DialogTitle>
          <DialogDescription>
            Esta PR já foi encaminhada ao canal <strong>#{channel}</strong>. Deseja enviar novamente?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={loading} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button disabled={loading} onClick={onConfirm} type="button">
            {loading ? "Enviando…" : "Enviar novamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
