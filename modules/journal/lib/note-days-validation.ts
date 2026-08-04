import { z } from "zod";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";

const notebookDayField = z
  .string()
  .refine((value) => isValidNotebookDay(value), "Notebook day inválido.");

export const noteDaysRangeSchema = z
  .object({
    from: notebookDayField,
    to: notebookDayField
  })
  .refine((value) => value.from <= value.to, {
    message: "Intervalo inválido: from deve ser anterior ou igual a to.",
    path: ["from"]
  });

export type NoteDaysRangeInput = z.input<typeof noteDaysRangeSchema>;
export type ValidatedNoteDaysRange = z.output<typeof noteDaysRangeSchema>;

export type NoteDaysRangeValidationResult =
  | { ok: true; value: ValidatedNoteDaysRange }
  | { ok: false; errors: Record<string, string> };

function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function validateNoteDaysRangeQuery(
  from: string | null | undefined,
  to: string | null | undefined
): NoteDaysRangeValidationResult {
  const result = noteDaysRangeSchema.safeParse({
    from: from ?? "",
    to: to ?? ""
  });
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: zodFieldErrors(result.error) };
}
