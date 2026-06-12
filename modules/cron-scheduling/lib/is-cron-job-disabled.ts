import type { CronJobScheduleSpec } from "@/modules/cron-scheduling/lib/types";

export function isCronJobDisabled(
  job: Pick<CronJobScheduleSpec, "disableEnvVar">,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!job.disableEnvVar) {
    return false;
  }
  return env[job.disableEnvVar] === "1";
}
