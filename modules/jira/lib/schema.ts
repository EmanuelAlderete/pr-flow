import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { JiraIssueDetailDto, JiraIssueDto, JiraSprintsResponse } from "@/modules/jira/lib/domain";

export const jiraSyncMeta = pgTable("jira_sync_meta", {
  id: text("id").primaryKey().default("default"),
  email: text("email").notNull().default(""),
  displayName: text("display_name"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error")
});

export const jiraSprintsCache = pgTable("jira_sprints_cache", {
  id: text("id").primaryKey().default("default"),
  payload: jsonb("payload").$type<JiraSprintsResponse>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export const jiraIssuesCache = pgTable("jira_issues_cache", {
  sprintFilter: text("sprint_filter").primaryKey(),
  issues: jsonb("issues").$type<JiraIssueDto[]>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export const jiraIssueDetails = pgTable("jira_issue_details", {
  issueKey: text("issue_key").primaryKey(),
  payload: jsonb("payload").$type<JiraIssueDetailDto>().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow()
});

export type JiraSyncMetaRow = typeof jiraSyncMeta.$inferSelect;
