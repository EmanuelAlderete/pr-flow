import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Singleton row (`id = default`) for app-wide settings. */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().notNull().default("default"),
  githubLogin: text("github_login").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export type AppSettingsRow = typeof appSettings.$inferSelect;
