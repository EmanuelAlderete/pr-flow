import { NextResponse } from "next/server";
import { isCronManualConfirmationValid } from "@/modules/devtools/lib/cron-confirmation";
import { isCronJobId } from "@/modules/devtools/lib/cron-job-definitions";
import { runCronJob } from "@/modules/devtools/lib/cron-job-runners";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";

const API_CRON_RUN_LOG_SOURCE = "api:cron-run";

type RunCronBody = {
  jobId?: string;
  confirmationPhrase?: string;
};

export async function POST(request: Request) {
  let body: RunCronBody;

  try {
    body = (await request.json()) as RunCronBody;
  } catch {
    return NextResponse.json({ message: "Corpo JSON inválido." }, { status: 400 });
  }

  const jobId = body.jobId?.trim();
  const confirmationPhrase = body.confirmationPhrase ?? "";

  if (!jobId || !isCronJobId(jobId)) {
    return NextResponse.json(
      { message: "jobId inválido. Use um dos fluxos listados em /devtools/crons." },
      { status: 400 }
    );
  }

  if (!isCronManualConfirmationValid(confirmationPhrase)) {
    return NextResponse.json(
      {
        message:
          "Frase de confirmação incorreta. Copie e cole a frase completa exibida na tela, sem alterações."
      },
      { status: 403 }
    );
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: API_CRON_RUN_LOG_SOURCE,
    message: `Execução manual de cron solicitada via devtools (${jobId}).`,
    details: { jobId }
  });

  try {
    const result = await runCronJob(jobId, true);
    writeSystemLogFireAndForget({
      level: result.status === "error" ? "error" : result.status === "skipped" ? "warn" : "info",
      source: API_CRON_RUN_LOG_SOURCE,
      message: result.message,
      details: { jobId, status: result.status }
    });
    const status = result.status === "error" ? 500 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao executar o fluxo.";
    writeSystemLogFireAndForget({
      level: "error",
      source: API_CRON_RUN_LOG_SOURCE,
      message,
      details: { jobId, error: sanitizeErrorForLog(error) }
    });
    return NextResponse.json({ message }, { status: 500 });
  }
}
