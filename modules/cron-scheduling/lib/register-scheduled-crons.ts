import { isCronJobDisabled } from "@/modules/cron-scheduling/lib/is-cron-job-disabled";
import { resolveSummaryCronTimezone } from "@/modules/cron-scheduling/lib/summary-timezone";
import type { CronJobSchedule, CronScheduler } from "@/modules/cron-scheduling/lib/types";
import { resetCronSchedulingStateForTests } from "@/modules/cron-scheduling/lib/start-all-crons";

export type RegisterScheduledCronsOptions = {
  scheduler: CronScheduler;
  env?: NodeJS.ProcessEnv;
  onDisabled?: (job: CronJobSchedule) => void;
};

function scheduleOptionsForJob(
  job: CronJobSchedule,
  env: NodeJS.ProcessEnv
): { timezone?: string } | undefined {
  if (!job.useSummaryTimezone) {
    return undefined;
  }
  return { timezone: resolveSummaryCronTimezone(env) };
}

export function registerScheduledCrons(
  jobs: readonly CronJobSchedule[],
  { scheduler, env = process.env, onDisabled }: RegisterScheduledCronsOptions
): void {
  for (const job of jobs) {
    if (isCronJobDisabled(job, env)) {
      onDisabled?.(job);
      continue;
    }

    const invoke = () => {
      void Promise.resolve(job.run()).catch(() => {
        // erros de domínio são tratados nos runners; falhas inesperadas não derrubam o processo
      });
    };

    if (job.runOnStart) {
      invoke();
    }

    scheduler.schedule(job.expression, invoke, scheduleOptionsForJob(job, env));
  }
}

export function resetCronSchedulingForTests(): void {
  resetCronSchedulingStateForTests();
}
