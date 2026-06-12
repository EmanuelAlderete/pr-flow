"use client";

import { useCallback, useState } from "react";
import { Clock, Play, ScrollText } from "lucide-react";
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
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CRON_MANUAL_CONFIRMATION_PHRASE,
  isCronManualConfirmationValid
} from "@/modules/devtools/lib/cron-confirmation";
import {
  CRON_JOB_DEFINITIONS,
  type CronJobDefinition,
  type CronJobId
} from "@/modules/devtools/lib/cron-job-definitions";
import { grafanaLokiExploreUrl } from "@/modules/observability/lib/grafana-links";
type CronRunResponse = {
  jobId: string;
  status: "ok" | "skipped" | "error";
  message: string;
};

type RunState = {
  jobId: CronJobId;
  running: boolean;
};

export function CronsPage() {
  const [selectedJob, setSelectedJob] = useState<CronJobDefinition | null>(null);
  const [phrase, setPhrase] = useState("");
  const [runState, setRunState] = useState<RunState | null>(null);

  const phraseValid = isCronManualConfirmationValid(phrase);
  const isRunning = runState !== null;

  const closeDialog = useCallback(() => {
    if (isRunning) {
      return;
    }
    setSelectedJob(null);
    setPhrase("");
  }, [isRunning]);

  const openDialog = (job: CronJobDefinition) => {
    setSelectedJob(job);
    setPhrase("");
  };

  const runJob = async () => {
    if (!selectedJob || !phraseValid || isRunning) {
      return;
    }

    setRunState({ jobId: selectedJob.id, running: true });

    try {
      const response = await fetch("/api/devtools/crons/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          confirmationPhrase: phrase
        })
      });

      const payload = (await response.json()) as CronRunResponse & { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Não foi possível executar o fluxo.");
        return;
      }

      if (payload.status === "ok") {
        toast.success(payload.message);
      } else if (payload.status === "skipped") {
        toast.warning(payload.message);
      } else {
        toast.error(payload.message);
      }

      setSelectedJob(null);
      setPhrase("");
    } catch {
      toast.error("Falha de rede ao executar o fluxo.");
    } finally {
      setRunState(null);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        {CRON_JOB_DEFINITIONS.map((job) => {
          const jobRunning = runState?.jobId === job.id;
          return (
            <Surface key={job.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h2 className="text-sm font-semibold text-[var(--app-text)]">{job.label}</h2>
                  <p className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
                    <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {job.schedule}
                  </p>
                  <p className="text-sm text-[var(--app-text-muted)]">{job.description}</p>
                  <a
                    href={grafanaLokiExploreUrl(job.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--brand-bright)] hover:underline"
                  >
                    <ScrollText className="size-3.5" aria-hidden />
                    Ver logs no Grafana
                  </a>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={isRunning}
                  onClick={() => openDialog(job)}
                  aria-label={`Forçar execução: ${job.label}`}
                >
                  <Play className="size-4" aria-hidden />
                  {jobRunning ? "Executando…" : "Forçar execução"}
                </Button>
              </div>
            </Surface>
          );
        })}
      </div>

      <Dialog
        open={selectedJob !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar execução manual</DialogTitle>
            <DialogDescription>
              {selectedJob ? (
                <>
                  Você está prestes a executar <strong>{selectedJob.label}</strong> fora do
                  agendamento. Copie a frase abaixo e cole no campo sem alterar nenhum caractere.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p
              className="rounded-lg border border-[var(--app-border)] bg-black/25 p-3 text-xs leading-relaxed text-[var(--app-text-muted)] select-all"
              data-testid="cron-confirmation-phrase"
            >
              {CRON_MANUAL_CONFIRMATION_PHRASE}
            </p>
            <Textarea
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              placeholder="Cole aqui a frase de confirmação completa"
              rows={5}
              disabled={isRunning}
              aria-label="Frase de confirmação para execução manual de cron"
              className={cn(
                phrase.length > 0 && !phraseValid && "border-amber-500/50 focus-visible:ring-amber-500/30"
              )}
            />
            {phrase.length > 0 && !phraseValid ? (
              <p className="text-xs text-amber-300" role="status">
                A frase ainda não confere com o texto exigido ({phrase.length}/
                {CRON_MANUAL_CONFIRMATION_PHRASE.length} caracteres).
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={isRunning} onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!phraseValid || isRunning}
              onClick={() => void runJob()}
            >
              {isRunning ? "Executando…" : "Executar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
