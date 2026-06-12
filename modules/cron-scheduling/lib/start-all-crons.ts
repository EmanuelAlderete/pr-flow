import cron from "node-cron";
import { buildScheduledCronJobs } from "@/modules/cron-scheduling/lib/build-runtime-jobs";
import { runCronCatchupOnStart } from "@/modules/cron-scheduling/lib/run-cron-catchup-on-start";
import { registerScheduledCrons } from "@/modules/cron-scheduling/lib/register-scheduled-crons";
import type { CronScheduler } from "@/modules/cron-scheduling/lib/types";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";

let started = false;

function createNodeCronScheduler(): CronScheduler {
  return {
    schedule(expression, callback, options) {
      cron.schedule(expression, callback, options);
    }
  };
}

export function startAllCrons(): void {
  if (started) {
    return;
  }
  started = true;

  registerScheduledCrons(buildScheduledCronJobs(), {
    scheduler: createNodeCronScheduler(),
    onDisabled(job) {
      writeSystemLogFireAndForget({
        level: "info",
        source: job.id,
        message: `Cron desabilitado (${job.disableEnvVar}=1).`
      });
    }
  });

  void runCronCatchupOnStart().catch(() => {
    // erros inesperados não derrubam o processo; detalhes nos runners de resumo
  });
}

export function resetCronSchedulingStateForTests(): void {
  started = false;
}
