import { z } from "zod";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";

export const journalDayDraftRequestSchema = z.object({
  notebookDay: z
    .string()
    .refine((value) => isValidNotebookDay(value), "Notebook day inválido.")
});

export type JournalDayDraftRequest = z.infer<typeof journalDayDraftRequestSchema>;

export function journalDayDraftFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
