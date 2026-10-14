import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const summaryTypes = ["daily", "weekly", "dashboard"] as const;
export type SummaryType = (typeof summaryTypes)[number];

export const summaries = sqliteTable(
  "summaries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type").$type<SummaryType>().notNull(),
    periodKey: text("period_key").notNull(),
    content: text("content").notNull(),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [uniqueIndex("summaries_type_period_key_unique").on(table.type, table.periodKey)]
);

export type SummaryRow = typeof summaries.$inferSelect;
