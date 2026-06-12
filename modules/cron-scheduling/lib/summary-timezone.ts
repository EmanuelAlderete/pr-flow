export function resolveSummaryCronTimezone(env: NodeJS.ProcessEnv = process.env): string {
  return env.SUMMARY_CRON_TZ?.trim() || "America/Sao_Paulo";
}
