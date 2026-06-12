import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { ghLogger } from "@/modules/prs/lib/gh-logger";

function shouldSkipAppInitialization(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Initialize app-level services. Called during server startup (instrumentation).
 */
export function initializeApp(): void {
  if (shouldSkipAppInitialization()) {
    return;
  }

  try {
    ghLogger.validateLogDirectory();
  } catch (error) {
    writeSystemLogFireAndForget({
      level: "error",
      source: "system",
      message: "Falha na inicialização do app.",
      details: sanitizeErrorForLog(error)
    });
    throw error;
  }
}
