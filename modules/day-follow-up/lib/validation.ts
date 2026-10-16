import { z } from "zod";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";

const notebookDayField = z
  .string()
  .refine((value) => isValidNotebookDay(value), "Notebook day inválido.");

export const followUpDaySchema = z.object({
  notebookDay: notebookDayField
});

export const quizAnswerSchema = z.object({
  notebookDay: notebookDayField,
  kind: z.enum(["gap", "mentoring"]),
  beat: z.enum(["yesterday", "today", "blocker"]).nullable(),
  question: z.string().trim().min(1).max(2_000),
  answer: z.string().trim().min(1).max(4_000)
});

export type QuizAnswerInput = z.infer<typeof quizAnswerSchema>;
