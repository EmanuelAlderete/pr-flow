import { NextResponse } from "next/server";
import { getPortainerStatus } from "@/modules/local-docker/lib/local-docker-portainer-service";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";

const API_LOCAL_DOCKER_LOG_SOURCE = "api:local-docker-status";

export async function GET() {
  try {
    const status = await getPortainerStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar Portainer.";
    writeSystemLogFireAndForget({
      level: "error",
      source: API_LOCAL_DOCKER_LOG_SOURCE,
      message,
      details: { error: sanitizeErrorForLog(error) }
    });
    return NextResponse.json({ message }, { status: 500 });
  }
}
