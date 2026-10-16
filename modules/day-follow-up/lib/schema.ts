import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const standupScripts = sqliteTable(
  "standup_scripts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    notebookDay: text("notebook_day").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [uniqueIndex("standup_scripts_notebook_day_unique").on(table.notebookDay)]
);

export const quizAnswers = sqliteTable("quiz_answers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  notebookDay: text("notebook_day").notNull(),
  kind: text("kind").notNull(),
  beat: text("beat"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export type StandupScriptRow = typeof standupScripts.$inferSelect;
export type QuizAnswerRow = typeof quizAnswers.$inferSelect;
