export type LogLevel = "debug" | "info" | "warn" | "error";

export const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

export const CRON_LOG_SOURCES = [
  { id: "cron:prs-sync", label: "PRs — sincronização (10 min)" },
  { id: "cron:jira-sync", label: "Jira — sincronização (10 min)" },
  { id: "cron:summaries-daily", label: "Resumos — diário (meia-noite)" },
  { id: "cron:summaries-weekly", label: "Resumos — semanal (segunda)" },
  { id: "cron:dashboard-briefing", label: "Dash — briefing (a cada hora)" }
] as const;

export type CronLogSourceId = (typeof CRON_LOG_SOURCES)[number]["id"];

export type SystemLogEvent = {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: unknown;
};
