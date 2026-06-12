import { NextResponse } from "next/server";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { getMonitorFromCache } from "@/modules/prs/lib/pr-read-service";
import { enrichPrApiResponse } from "@/modules/prs/lib/pr-slack-share-enrichment";
import { prErrorResponse } from "@/modules/prs/lib/pr-route-errors";
import { syncPrCache } from "@/modules/prs/lib/pr-sync-service";

const API_PRS_SYNC_LOG_SOURCE = "api:prs-sync";

export async function GET() {
  try {
    const result = await getMonitorFromCache();
    return NextResponse.json(result);
  } catch (error) {
    return prErrorResponse(error, "Nao foi possivel carregar o monitor de PRs.");
  }
}

export async function POST() {
  writeSystemLogFireAndForget({
    level: "info",
    source: API_PRS_SYNC_LOG_SOURCE,
    message: "Sincronização manual de PRs solicitada via API."
  });

  const sync = await syncPrCache();

  if (sync.status === "ok") {
    writeSystemLogFireAndForget({
      level: "info",
      source: API_PRS_SYNC_LOG_SOURCE,
      message: `Sincronização concluída (${sync.prCount} PRs).`,
      details: { prCount: sync.prCount }
    });
  } else if (sync.status === "skipped") {
    writeSystemLogFireAndForget({
      level: "warn",
      source: API_PRS_SYNC_LOG_SOURCE,
      message: sync.error ?? "Sincronização ignorada.",
      details: { status: sync.status }
    });
  } else {
    writeSystemLogFireAndForget({
      level: sync.status === "unauthenticated" ? "warn" : "error",
      source: API_PRS_SYNC_LOG_SOURCE,
      message: sync.error ?? "Falha ao sincronizar PRs com o GitHub.",
      details: { status: sync.status }
    });
  }

  if (sync.response) {
    return NextResponse.json(await enrichPrApiResponse(sync.response));
  }

  return NextResponse.json(
    { status: "error", message: sync.error ?? "Falha ao sincronizar PRs com o GitHub." },
    { status: sync.status === "skipped" ? 503 : 500 }
  );
}
