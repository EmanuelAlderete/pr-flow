"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ptBR } from "@/modules/messages";
import {
  isLocalReviewModelId,
  LOCAL_REVIEW_MODEL,
  LOCAL_REVIEW_MODEL_IDS,
  type LocalReviewModelId
} from "@/modules/prs/lib/local-review/local-review-models";

export async function requestLocalReview(
  repository: string,
  prNumber: number,
  model: LocalReviewModelId
): Promise<{ level: "success" | "warning" | "error"; message: string }> {
  try {
    const response = await fetch("/api/prs/local-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repository, number: prNumber, model })
    });
    const body = (await response.json()) as { status?: string; message?: string };
    const message = body.message ?? ptBR.localReview.triggerFailed;
    if (!response.ok || body.status === "error") {
      return { level: "error", message };
    }
    if (body.status === "skipped") {
      return { level: "warning", message };
    }
    return { level: "success", message };
  } catch {
    return { level: "error", message: ptBR.localReview.triggerFailed };
  }
}

const MODEL_COPY: Record<LocalReviewModelId, { label: string; hint: string }> = {
  haiku: { label: ptBR.localReview.modelHaiku, hint: ptBR.localReview.modelHaikuHint },
  sonnet: { label: ptBR.localReview.modelSonnet, hint: ptBR.localReview.modelSonnetHint },
  opus: { label: ptBR.localReview.modelOpus, hint: ptBR.localReview.modelOpusHint }
};

export function PrLocalReviewStartDialog({
  open,
  onOpenChange,
  repository,
  prNumber,
  onStarted
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: string;
  prNumber: number;
  onStarted?: () => void;
}) {
  const [model, setModel] = useState<LocalReviewModelId>(LOCAL_REVIEW_MODEL);
  const [starting, setStarting] = useState(false);
  const repo = repository.slice(repository.lastIndexOf("/") + 1);

  async function startReview() {
    setStarting(true);
    const result = await requestLocalReview(repository, prNumber, model);
    if (result.level === "error") {
      toast.error(result.message);
    } else if (result.level === "warning") {
      toast.warning(result.message);
    } else {
      toast.success(result.message);
      onOpenChange(false);
      onStarted?.();
    }
    setStarting(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!starting) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ptBR.localReview.modelTitle}</DialogTitle>
          <DialogDescription>
            {repo} #{prNumber}. {ptBR.localReview.modelDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Select
            value={model}
            onValueChange={(value) => {
              if (typeof value === "string" && isModelId(value)) {
                setModel(value);
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label={ptBR.localReview.modelTitle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCAL_REVIEW_MODEL_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {MODEL_COPY[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-[var(--app-text-muted)]">{MODEL_COPY[model].hint}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={starting} onClick={() => onOpenChange(false)}>
            {ptBR.localReview.modelCancel}
          </Button>
          <Button type="button" disabled={starting} onClick={() => void startReview()}>
            {starting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            {ptBR.localReview.modelStart}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isModelId(value: string): value is LocalReviewModelId {
  return isLocalReviewModelId(value);
}
