export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeApp } = await import("@/lib/init");
    initializeApp();

    const { recordAppBoot } = await import("@/modules/observability/lib/metrics");
    const { writeSystemLogFireAndForget } = await import(
      "@/modules/observability/lib/system-logger"
    );
    recordAppBoot();
    writeSystemLogFireAndForget({
      level: "info",
      source: "system",
      message: "Servidor iniciado; crons serão registrados."
    });

    const { startAllCrons } = await import("@/modules/cron-scheduling");
    startAllCrons();
  }
}
