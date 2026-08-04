import { NextResponse } from "next/server";
import { LocalDockerConfigError } from "@/modules/local-docker/lib/local-docker-config";
import { startPortainer } from "@/modules/local-docker/lib/local-docker-portainer-service";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";

const API_LOCAL_DOCKER_LOG_SOURCE = "api:local-docker-start";

export async function POST() {
  writeSystemLogFireAndForget({
    level: "info",
    source: API_LOCAL_DOCKER_LOG_SOURCE,
    message: "Subida do Portainer solicitada via devtools."
  });

  try {
    const result = await startPortainer();

    writeSystemLogFireAndForget({
      level: result.status === "error" ? "error" : "info",
      source: API_LOCAL_DOCKER_LOG_SOURCE,
      message: result.message,
      details: { state: result.state }
    });

    const status = result.status === "error" ? 500 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof LocalDockerConfigError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : "Falha ao subir o Portainer.";
    writeSystemLogFireAndForget({
      level: "error",
      source: API_LOCAL_DOCKER_LOG_SOURCE,
      message,
      details: { error: sanitizeErrorForLog(error) }
    });
    return NextResponse.json({ message }, { status: 500 });
  }
}
