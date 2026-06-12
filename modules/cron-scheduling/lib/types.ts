import type { CronLogSourceId } from "@/modules/observability/lib/log-domain";

export type CronJobScheduleSpec = {
  id: CronLogSourceId;
  expression: string;
  disableEnvVar?: string;
  /** Usa SUMMARY_CRON_TZ quando definido; senão America/Sao_Paulo */
  useSummaryTimezone?: boolean;
  runOnStart?: boolean;
};

export type CronJobSchedule = CronJobScheduleSpec & {
  run: () => void | Promise<void>;
};

export type CronScheduler = {
  schedule: (
    expression: string,
    callback: () => void,
    options?: { timezone?: string }
  ) => void;
};
