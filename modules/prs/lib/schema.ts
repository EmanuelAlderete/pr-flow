import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type {
  MonitoredPr,
  PrReviewContextRecord,
  PrTimelineEventPayload,
  ReviewerQueuePr
} from "@/modules/prs/lib/domain";

export const prSyncMeta = sqliteTable("pr_sync_meta", {
  id: text("id").primaryKey().default("default"),
  githubLogin: text("github_login"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error")
});

export const prMonitorCache = sqliteTable("pr_monitor_cache", {
  id: text("id").primaryKey().default("default"),
  data: text("data", { mode: "json" }).$type<MonitoredPr[]>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const prReviewerQueueCache = sqliteTable("pr_reviewer_queue_cache", {
  id: text("id").primaryKey().default("default"),
  data: text("data", { mode: "json" }).$type<ReviewerQueuePr[]>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const prReviewContextCache = sqliteTable("pr_review_context_cache", {
  id: text("id").primaryKey().default("default"),
  data: text("data", { mode: "json" }).$type<PrReviewContextRecord[]>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const prTimelineEvents = sqliteTable("pr_timeline_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  githubLogin: text("github_login").notNull(),
  notebookDay: text("notebook_day").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  eventType: text("event_type").notNull(),
  prId: text("pr_id").notNull(),
  prNumber: integer("pr_number").notNull(),
  prTitle: text("pr_title").notNull(),
  repository: text("repository").notNull(),
  jiraIssueKey: text("jira_issue_key"),
  payload: text("payload", { mode: "json" }).$type<PrTimelineEventPayload>().notNull(),
  dedupeKey: text("dedupe_key").notNull().unique()
});

export type PrSyncMetaRow = typeof prSyncMeta.$inferSelect;

/** Repositórios GitHub monitorados (sync de PRs e wizard de abrir PR). */
export const monitoredRepositories = sqliteTable(
  "monitored_repositories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    repository: text("repository").notNull(),
    defaultBranch: text("default_branch").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [uniqueIndex("monitored_repositories_repository_unique").on(table.repository)]
);

export type MonitoredRepositoryRow = typeof monitoredRepositories.$inferSelect;
export type MonitoredRepositoryInsert = typeof monitoredRepositories.$inferInsert;

/** Último envio de uma PR ao canal do Slack (chave estável: URL do GitHub). */
export const prSlackShares = sqliteTable(
  "pr_slack_shares",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    prUrl: text("pr_url").notNull(),
    prId: text("pr_id"),
    channel: text("channel").notNull(),
    threadTs: text("thread_ts").notNull(),
    sharedAt: integer("shared_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [uniqueIndex("pr_slack_shares_pr_url_unique").on(table.prUrl)]
);

export type PrSlackShareRow = typeof prSlackShares.$inferSelect;

/** Branch destino (base) escolhida no wizard de abrir PR, por branch de feature. */
export const openPrBranchBases = sqliteTable(
  "open_pr_branch_bases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    repository: text("repository").notNull(),
    branchName: text("branch_name").notNull(),
    baseBranch: text("base_branch").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [
    uniqueIndex("open_pr_branch_bases_repository_branch_unique").on(table.repository, table.branchName)
  ]
);

export type OpenPrBranchBaseRow = typeof openPrBranchBases.$inferSelect;
export type OpenPrBranchBaseInsert = typeof openPrBranchBases.$inferInsert;

/** Revisão local (Claude Code) de uma PR num SHA. Não aprova nem rejeita no GitHub. */
export const prLocalReviews = sqliteTable(
  "pr_local_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    repository: text("repository").notNull(),
    prNumber: integer("pr_number").notNull(),
    prId: text("pr_id").notNull(),
    headSha: text("head_sha").notNull(),
    baseRef: text("base_ref").notNull(),
    status: text("status").notNull(),
    model: text("model").notNull(),
    summary: text("summary"),
    report: text("report"),
    error: text("error"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [
    uniqueIndex("pr_local_reviews_repo_pr_sha_unique").on(table.repository, table.prNumber, table.headSha)
  ]
);

export type PrLocalReviewRow = typeof prLocalReviews.$inferSelect;
