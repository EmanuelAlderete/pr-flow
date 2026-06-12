import { ptBR } from "@/modules/messages";
import { getScheduledCronJob } from "@/modules/cron-scheduling/lib/schedules";
import { isCronJobDisabled } from "@/modules/cron-scheduling/lib/is-cron-job-disabled";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import {
  runSummaryCatchup,
  type SummaryCatchupReport
} from "@/modules/summaries/lib/summary-catchup";

function formatCatchupMessage(report: SummaryCatchupReport): string {
  const parts: string[] = [];

  if (report.dailyGenerated.length > 0) {
    parts.push(`diários gerados: ${report.dailyGenerated.join(", ")}`);
  }
  if (report.dailySkipped.length > 0) {
    parts.push(`diários já em dia (${report.dailySkipped.length} dia(s))`);
  }
  if (report.dailyFailed.length > 0) {
    parts.push(`diários com falha: ${report.dailyFailed.join(", ")}`);
  }
  if (report.weeklyGenerated.length > 0) {
    parts.push(`semanal gerado: ${report.weeklyGenerated.join(", ")}`);
  }
  if (report.weeklySkipped.length > 0) {
    parts.push("semanal já em dia");
  }
  if (report.weeklyFailed.length > 0) {
    parts.push(`semanal com falha: ${report.weeklyFailed.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("; ") : "nenhum resumo pendente";
}

function catchupHadWork(report: SummaryCatchupReport): boolean {
  return (
    report.dailyGenerated.length > 0 ||
    report.dailyFailed.length > 0 ||
    report.weeklyGenerated.length > 0 ||
    report.weeklyFailed.length > 0
  );
}

/**
 * After boot, generates daily/weekly summaries missed while the app was offline
 * (checks the database; does not use force).
 */
export async function runCronCatchupOnStart(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const summariesSpec = getScheduledCronJob("cron:summaries-daily");
  if (isCronJobDisabled(summariesSpec, env)) {
    return;
  }

  writeSystemLogFireAndForget({
    level: "debug",
    source: "cron:summaries-daily",
    message: ptBR.cron.bootCatchupCheck
  });

  const report = await runSummaryCatchup();
  const message = `Boot: ${formatCatchupMessage(report)}`;

  writeSystemLogFireAndForget({
    level: catchupHadWork(report) ? "info" : "debug",
    source: "cron:summaries-daily",
    message,
    details: report
  });
}
