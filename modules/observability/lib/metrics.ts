import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
  type Counter as CounterType,
  type Histogram as HistogramType
} from "prom-client";

type MetricsBundle = {
  registry: Registry;
  cronRunsTotal: CounterType<"job_id" | "status" | "manual">;
  cronRunDurationSeconds: HistogramType<"job_id" | "manual">;
  appBootTotal: CounterType<string>;
};

const globalForMetrics = globalThis as typeof globalThis & {
  __prflowMetrics?: MetricsBundle;
};

function createMetricsBundle(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "prflow_" });

  const cronRunsTotal = new Counter({
    name: "prflow_cron_runs_total",
    help: "Total de execuções de cron jobs",
    labelNames: ["job_id", "status", "manual"] as const,
    registers: [registry]
  });

  const cronRunDurationSeconds = new Histogram({
    name: "prflow_cron_run_duration_seconds",
    help: "Duração das execuções de cron jobs em segundos",
    labelNames: ["job_id", "manual"] as const,
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
    registers: [registry]
  });

  const appBootTotal = new Counter({
    name: "prflow_app_boot_total",
    help: "Total de boots do servidor Node",
    registers: [registry]
  });

  return { registry, cronRunsTotal, cronRunDurationSeconds, appBootTotal };
}

function getMetrics(): MetricsBundle {
  if (!globalForMetrics.__prflowMetrics) {
    globalForMetrics.__prflowMetrics = createMetricsBundle();
  }
  return globalForMetrics.__prflowMetrics;
}

export function recordCronRun(
  jobId: string,
  status: "ok" | "skipped" | "error",
  manual: boolean,
  durationMs: number
): void {
  const { cronRunsTotal, cronRunDurationSeconds } = getMetrics();
  const manualLabel = manual ? "true" : "false";
  cronRunsTotal.inc({ job_id: jobId, status, manual: manualLabel });
  cronRunDurationSeconds.observe({ job_id: jobId, manual: manualLabel }, durationMs / 1000);
}

export function recordAppBoot(): void {
  getMetrics().appBootTotal.inc();
}

export async function getMetricsText(): Promise<string> {
  return getMetrics().registry.metrics();
}

export function getMetricsContentType(): string {
  return getMetrics().registry.contentType;
}
