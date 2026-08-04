import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type {
  MonitoredPr,
  PrReviewContextRecord,
  PrTimelineEventPayload,
  ReviewerQueuePr
} from "@/modules/prs/lib/domain";

export const prSyncMeta = pgTable("pr_sync_meta", {
  id: text("id").primaryKey().default("default"),
  githubLogin: text("github_login"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error")
});

export const prMonitorCache = pgTable("pr_monitor_cache", {
  id: text("id").primaryKey().default("default"),
  data: jsonb("data").$type<MonitoredPr[]>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export const prReviewerQueueCache = pgTable("pr_reviewer_queue_cache", {
  id: text("id").primaryKey().default("default"),
  data: jsonb("data").$type<ReviewerQueuePr[]>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export const prReviewContextCache = pgTable("pr_review_context_cache", {
  id: text("id").primaryKey().default("default"),
  data: jsonb("data").$type<PrReviewContextRecord[]>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export const prTimelineEvents = pgTable("pr_timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubLogin: text("github_login").notNull(),
  notebookDay: text("notebook_day").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  eventType: text("event_type").notNull(),
  prId: text("pr_id").notNull(),
  prNumber: integer("pr_number").notNull(),
  prTitle: text("pr_title").notNull(),
  repository: text("repository").notNull(),
  jiraIssueKey: text("jira_issue_key"),
  payload: jsonb("payload").$type<PrTimelineEventPayload>().notNull(),
  dedupeKey: text("dedupe_key").notNull().unique()
});

export type PrSyncMetaRow = typeof prSyncMeta.$inferSelect;

/** Repositórios GitHub monitorados (sync de PRs e wizard de abrir PR). */
export const monitoredRepositories = pgTable(
  "monitored_repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repository: text("repository").notNull(),
    defaultBranch: text("default_branch").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("monitored_repositories_repository_unique").on(table.repository)]
);

export type MonitoredRepositoryRow = typeof monitoredRepositories.$inferSelect;
export type MonitoredRepositoryInsert = typeof monitoredRepositories.$inferInsert;

/** Último envio de uma PR ao canal do Slack (chave estável: URL do GitHub). */
export const prSlackShares = pgTable(
  "pr_slack_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prUrl: text("pr_url").notNull(),
    prId: text("pr_id"),
    channel: text("channel").notNull(),
    threadTs: text("thread_ts").notNull(),
    sharedAt: timestamp("shared_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("pr_slack_shares_pr_url_unique").on(table.prUrl)]
);

export type PrSlackShareRow = typeof prSlackShares.$inferSelect;

/** Branch destino (base) escolhida no wizard de abrir PR, por branch de feature. */
export const openPrBranchBases = pgTable(
  "open_pr_branch_bases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repository: text("repository").notNull(),
    branchName: text("branch_name").notNull(),
    baseBranch: text("base_branch").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("open_pr_branch_bases_repository_branch_unique").on(table.repository, table.branchName)
  ]
);

export type OpenPrBranchBaseRow = typeof openPrBranchBases.$inferSelect;
export type OpenPrBranchBaseInsert = typeof openPrBranchBases.$inferInsert;
