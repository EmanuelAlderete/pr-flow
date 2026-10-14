import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Singleton row (`id = default`) for app-wide settings. */
export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey().notNull().default("default"),
  githubLogin: text("github_login").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export type AppSettingsRow = typeof appSettings.$inferSelect;
