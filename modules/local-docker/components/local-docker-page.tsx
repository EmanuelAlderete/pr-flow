"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import type {
  PortainerRuntimeState,
  PortainerStartResult,
  PortainerStatus
} from "@/modules/local-docker/lib/local-docker-portainer-service";

const STACK_URLS = [
  { label: "Admin", href: "http://localhost:3000" },
  { label: "Front", href: "http://localhost:3001" },
  { label: "Credits", href: "http://localhost:3002" },
  { label: "Backend API", href: "http://localhost:8080/api" }
] as const;

const STATE_LABEL: Record<PortainerRuntimeState, string> = {
  stopped: "Desligado",
  starting: "Iniciando",
  running: "Rodando",
  unhealthy: "Instável"
};

function stateBadgeClass(state: PortainerRuntimeState): string {
  switch (state) {
    case "running":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "starting":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "unhealthy":
      return "border-rose-500/40 bg-rose-500/10 text-rose-200";
    default:
      return "border-[var(--app-border)] bg-black/20 text-[var(--app-text-muted)]";
  }
}

export function LocalDockerPage() {
  const [status, setStatus] = useState<PortainerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/devtools/local-docker/status");
      const payload = (await response.json()) as PortainerStatus | { message?: string };

      if (!response.ok) {
        toast.error("message" in payload ? payload.message : "Falha ao consultar Portainer.");
        return;
      }

      setStatus(payload as PortainerStatus);
    } catch {
      toast.error("Falha de rede ao consultar Portainer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  const startPortainer = async () => {
    setStarting(true);
    try {
      const response = await fetch("/api/devtools/local-docker/start", { method: "POST" });
      const payload = (await response.json()) as PortainerStartResult & { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Não foi possível subir o Portainer.");
        return;
      }

      toast.success(payload.message);
      await refreshStatus();

      if (payload.portainerUrl) {
        window.open(payload.portainerUrl, "portainer", "noopener,noreferrer");
      }
    } catch {
      toast.error("Falha de rede ao subir o Portainer.");
    } finally {
      setStarting(false);
    }
  };

  const portainerUrl = status?.portainerUrl ?? "https://localhost:9443";
  const isRunning = status?.state === "running" || status?.state === "starting";

  return (
    <div className="grid gap-4">
      <Surface className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--app-text)]">Portainer</h2>
              {status ? (
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    stateBadgeClass(status.state)
                  )}
                >
                  {STATE_LABEL[status.state]}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-[var(--app-text-muted)]">
              Um clique sobe o Portainer do stack Jusfy local. A partir dele você liga, desliga e
              inspeciona todos os serviços do{" "}
              <code className="text-xs">docker-compose.dev.yml</code>.
            </p>
            {status?.statusText ? (
              <p className="text-xs text-[var(--app-text-muted)]">{status.statusText}</p>
            ) : null}
            {!loading && status && !status.configured ? (
              <p className="text-xs text-amber-300" role="status">
                Configure <code className="text-xs">LOCAL_DOCKER_ROOT</code> no .env apontando para
                a pasta do compose local (ex.:{" "}
                <code className="text-xs">…/local-docker</code>).
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || starting}
              onClick={() => void refreshStatus()}
              aria-label="Atualizar status do Portainer"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
              Atualizar
            </Button>
            {!isRunning ? (
              <Button
                type="button"
                disabled={!status?.configured || starting || loading}
                onClick={() => void startPortainer()}
                aria-label="Ligar Portainer"
              >
                <Play className="size-4" aria-hidden />
                {starting ? "Subindo…" : "Ligar Portainer"}
              </Button>
            ) : (
              <Button type="button" render={<a href={portainerUrl} target="_blank" rel="noopener noreferrer" />}>
                <ExternalLink className="size-4" aria-hidden />
                Abrir Portainer
              </Button>
            )}
          </div>
        </div>
      </Surface>

      <Surface className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--app-text)]">Painel</h3>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            O Portainer bloqueia embed por segurança (
            <code className="text-xs">frame-ancestors &apos;none&apos;</code>). Se o quadro abaixo
            ficar em branco, use <strong>Abrir Portainer</strong> — o painel abre em nova aba na
            mesma sessão.
          </p>
        </div>
        {isRunning ? (
          <iframe
            title="Portainer — gerenciamento Docker local"
            src={portainerUrl}
            className="h-[min(70vh,720px)] w-full border-0 bg-black/40"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="flex h-[min(40vh,320px)] items-center justify-center px-4 text-sm text-[var(--app-text-muted)]">
            Ligue o Portainer para gerenciar o ambiente local.
          </div>
        )}
      </Surface>

      <Surface className="p-4">
        <h3 className="text-sm font-semibold text-[var(--app-text)]">URLs do stack (host)</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" role="list">
          {STACK_URLS.map((entry) => (
            <li key={entry.href}>
              <a
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-bright)] hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
                {entry.label}
                <span className="text-xs text-[var(--app-text-muted)]">{entry.href}</span>
              </a>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
