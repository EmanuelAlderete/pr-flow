import type { CronLogSourceId } from "@/modules/observability/lib/log-domain";
import type { CronJobScheduleSpec } from "@/modules/cron-scheduling/lib/types";

export const CRON_JOB_SCHEDULE_SPECS: readonly CronJobScheduleSpec[] = [
  {
    id: "cron:prs-sync",
    expression: "*/10 * * * *",
    disableEnvVar: "DISABLE_PR_SYNC_CRON",
    runOnStart: true
  },
  {
    id: "cron:pr-local-review",
    expression: "*/15 * * * *",
    disableEnvVar: "DISABLE_PR_LOCAL_REVIEW_CRON"
  },
  {
    id: "cron:jira-sync",
    expression: "*/10 * * * *",
    disableEnvVar: "DISABLE_JIRA_SYNC_CRON",
    runOnStart: true
  },
  {
    id: "cron:summaries-daily",
    expression: "0 0 * * *",
    disableEnvVar: "DISABLE_SUMMARY_CRON",
    useSummaryTimezone: true
  },
  {
    id: "cron:summaries-weekly",
    expression: "0 0 * * *",
    disableEnvVar: "DISABLE_SUMMARY_CRON",
    useSummaryTimezone: true
  },
  {
    id: "cron:dashboard-briefing",
    expression: "0 * * * *",
    disableEnvVar: "DISABLE_DASHBOARD_BRIEFING_CRON",
    useSummaryTimezone: true,
    runOnStart: true
  }
] as const;

const SPECS_BY_ID = new Map<CronLogSourceId, CronJobScheduleSpec>(
  CRON_JOB_SCHEDULE_SPECS.map((spec) => [spec.id, spec])
);

export function getScheduledCronJob(id: CronLogSourceId): CronJobScheduleSpec {
  const spec = SPECS_BY_ID.get(id);
  if (!spec) {
    throw new Error(`Cron job desconhecido: ${id}`);
  }
  return spec;
}
