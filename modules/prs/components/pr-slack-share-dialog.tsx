"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { SlackRelatedPr } from "@/modules/prs/lib/core/pr-slack-related";
import { getJiraBrowseUrl } from "@/modules/jira-issue-key";

interface Props {
  open: boolean;
  issueKey: string;
  currentPrUrl: string;
  relatedPrs: SlackRelatedPr[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedUrls: string[]) => void;
}

export function PrSlackShareDialog({
  open,
  issueKey,
  currentPrUrl,
  relatedPrs,
  loading,
  onOpenChange,
  onConfirm
}: Props) {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([currentPrUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedUrls([currentPrUrl]);
  }, [open, currentPrUrl]);

  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);
  const hasSharedSelection = relatedPrs.some((pr) => selectedSet.has(pr.url) && pr.slackShare);
  const canConfirm = selectedUrls.length > 0 && !loading;

  const toggleUrl = (url: string, checked: boolean) => {
    setSelectedUrls((current) => {
      if (checked) {
        return current.includes(url) ? current : [...current, url];
      }
      return current.filter((item) => item !== url);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar ao Slack</DialogTitle>
          <DialogDescription>
            A mensagem no canal terá o link do Jira ({issueKey}). Na thread, serão enviados os links das PRs
            selecionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Canal: <span className="text-foreground">{issueKey}</span> —{" "}
            <a className="underline-offset-4 hover:underline" href={getJiraBrowseUrl(issueKey)} rel="noreferrer" target="_blank">
              {getJiraBrowseUrl(issueKey)}
            </a>
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">PRs abertas com {issueKey}</p>
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
              {relatedPrs.map((pr) => {
                const checkboxId = `slack-share-pr-${pr.id}`;
                const checked = selectedSet.has(pr.url);

                return (
                  <li key={pr.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={loading}
                      id={checkboxId}
                      onCheckedChange={(value) => toggleUrl(pr.url, value === true)}
                    />
                    <label className="min-w-0 cursor-pointer text-sm leading-snug" htmlFor={checkboxId}>
                      <span className="font-medium">
                        PR #{pr.number} · {pr.repository}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">{pr.title}</span>
                      {pr.slackShare ? (
                        <span className="mt-1 block text-xs text-muted-foreground">Já enviada ao Slack</span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {hasSharedSelection ? (
            <p className="text-sm text-muted-foreground">
              Pelo menos uma PR selecionada já foi enviada. Um novo envio criará outra mensagem no canal.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={loading} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button disabled={!canConfirm} onClick={() => onConfirm(selectedUrls)} type="button">
            {loading ? "Enviando…" : "Enviar ao Slack"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
