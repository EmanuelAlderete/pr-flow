import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { JiraIssueDetailDto, JiraIssueDto, JiraSprintsResponse } from "@/modules/jira/lib/domain";

export const jiraSyncMeta = sqliteTable("jira_sync_meta", {
  id: text("id").primaryKey().default("default"),
  email: text("email").notNull().default(""),
  displayName: text("display_name"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error")
});

export const jiraSprintsCache = sqliteTable("jira_sprints_cache", {
  id: text("id").primaryKey().default("default"),
  payload: text("payload", { mode: "json" }).$type<JiraSprintsResponse>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const jiraIssuesCache = sqliteTable("jira_issues_cache", {
  sprintFilter: text("sprint_filter").primaryKey(),
  issues: text("issues", { mode: "json" }).$type<JiraIssueDto[]>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const jiraIssueDetails = sqliteTable("jira_issue_details", {
  issueKey: text("issue_key").primaryKey(),
  payload: text("payload", { mode: "json" }).$type<JiraIssueDetailDto>().notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export type JiraSyncMetaRow = typeof jiraSyncMeta.$inferSelect;
