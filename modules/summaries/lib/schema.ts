import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const summaryTypeEnum = pgEnum("summary_type", ["daily", "weekly", "dashboard"]);

export const summaries = pgTable(
  "summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: summaryTypeEnum("type").notNull(),
    periodKey: text("period_key").notNull(),
    content: text("content").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("summaries_type_period_key_unique").on(table.type, table.periodKey)]
);

export type SummaryRow = typeof summaries.$inferSelect;
export type SummaryType = SummaryRow["type"];
