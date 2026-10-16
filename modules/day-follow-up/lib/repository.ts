import { asc, eq } from "drizzle-orm";
import type { GapFact, StandupBeat } from "@/modules/notebook-day";
import { getDb } from "@/modules/db/lib/db";
import type { StandupScriptContent } from "@/modules/day-follow-up/lib/subsidy";
import { quizAnswers, standupScripts } from "@/modules/day-follow-up/lib/schema";

export type StandupScriptStatus = "draft" | "used";

export type StandupScriptRecord = {
  notebookDay: string;
  content: StandupScriptContent;
  status: StandupScriptStatus;
};

export type QuizAnswerKind = "gap" | "mentoring";

export type QuizAnswerRecord = {
  id: string;
  notebookDay: string;
  kind: QuizAnswerKind;
  beat: StandupBeat | null;
  question: string;
  answer: string;
};

export type FollowUpStore = {
  getScript(notebookDay: string): Promise<StandupScriptRecord | null>;
  saveScript(record: StandupScriptRecord): Promise<StandupScriptRecord>;
  listAnswers(notebookDay: string): Promise<QuizAnswerRecord[]>;
  insertAnswer(input: Omit<QuizAnswerRecord, "id">): Promise<QuizAnswerRecord>;
};

function parseContent(raw: string, notebookDay: string): StandupScriptContent {
  try {
    const parsed = JSON.parse(raw) as Partial<StandupScriptContent>;
    if (
      typeof parsed.yesterday === "string" &&
      typeof parsed.today === "string" &&
      typeof parsed.blocker === "string"
    ) {
      return {
        yesterday: parsed.yesterday,
        today: parsed.today,
        blocker: parsed.blocker
      };
    }
  } catch {
    // Older or hand-edited rows fall through to a single frozen block.
  }

  return {
    yesterday: raw,
    today: "",
    blocker: "sem bloqueio"
  };
}

export function createDrizzleFollowUpStore(): FollowUpStore {
  return {
    async getScript(notebookDay) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(standupScripts)
        .where(eq(standupScripts.notebookDay, notebookDay));

      if (!row) {
        return null;
      }

      const status: StandupScriptStatus = row.status === "used" ? "used" : "draft";
      return {
        notebookDay,
        content: parseContent(row.content, notebookDay),
        status
      };
    },

    async saveScript(record) {
      const db = getDb();
      const now = new Date();
      await db
        .insert(standupScripts)
        .values({
          notebookDay: record.notebookDay,
          content: JSON.stringify(record.content),
          status: record.status,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: standupScripts.notebookDay,
          set: {
            content: JSON.stringify(record.content),
            status: record.status,
            updatedAt: now
          }
        });
      return record;
    },

    async listAnswers(notebookDay) {
      const db = getDb();
      const rows = await db
        .select()
        .from(quizAnswers)
        .where(eq(quizAnswers.notebookDay, notebookDay))
        .orderBy(asc(quizAnswers.createdAt));

      return rows.map((row) => ({
        id: row.id,
        notebookDay: row.notebookDay,
        kind: row.kind === "mentoring" ? "mentoring" : "gap",
        beat: row.beat === "yesterday" || row.beat === "today" || row.beat === "blocker" ? row.beat : null,
        question: row.question,
        answer: row.answer
      }));
    },

    async insertAnswer(input) {
      const db = getDb();
      const [row] = await db
        .insert(quizAnswers)
        .values({
          notebookDay: input.notebookDay,
          kind: input.kind,
          beat: input.beat,
          question: input.question,
          answer: input.answer
        })
        .returning();

      return {
        id: row.id,
        notebookDay: row.notebookDay,
        kind: input.kind,
        beat: input.beat,
        question: row.question,
        answer: row.answer
      };
    }
  };
}

export function gapFactsFromAnswers(answers: QuizAnswerRecord[]): GapFact[] {
  return answers
    .filter((answer) => answer.kind === "gap" && answer.beat)
    .map((answer) => ({
      beat: answer.beat as StandupBeat,
      answer: answer.answer
    }));
}

export function mentoringReadingsFromAnswers(answers: QuizAnswerRecord[]): string[] {
  return answers.filter((answer) => answer.kind === "mentoring").map((answer) => answer.answer);
}
