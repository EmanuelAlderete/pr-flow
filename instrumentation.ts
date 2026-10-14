export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeApp } = await import("@/lib/init");
    initializeApp();

    const { writeSystemLogFireAndForget } = await import(
      "@/modules/observability/lib/system-logger"
    );
    writeSystemLogFireAndForget({
      level: "info",
      source: "system",
      message: "Servidor iniciado; crons serão registrados."
    });

    const { startAllCrons } = await import("@/modules/cron-scheduling");
    startAllCrons();
  }
}
