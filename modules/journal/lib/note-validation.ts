import { z } from "zod";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";

const BODY_MAX = 20_000;

const notebookDayField = z
  .string()
  .refine((value) => isValidNotebookDay(value), "Notebook day inválido.");

const noteBodyField = z
  .string()
  .max(BODY_MAX, `Corpo da nota deve ter no máximo ${BODY_MAX} caracteres.`)
  .refine((value) => value.trim().length > 0, "Corpo da nota é obrigatório.");

export const createNoteSchema = z.object({
  notebookDay: notebookDayField,
  body: noteBodyField
});

export const updateNoteSchema = z.object({
  body: noteBodyField
});

export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type ValidatedCreateNoteInput = z.output<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
export type ValidatedUpdateNoteInput = z.output<typeof updateNoteSchema>;

export type NotebookDayValidationResult =
  | { ok: true; value: string }
  | { ok: false; errors: Record<string, string> };

export type CreateNoteValidationResult =
  | { ok: true; value: ValidatedCreateNoteInput }
  | { ok: false; errors: Record<string, string> };

export type UpdateNoteValidationResult =
  | { ok: true; value: ValidatedUpdateNoteInput }
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

export function validateNotebookDayQuery(
  notebookDay: string | null | undefined
): NotebookDayValidationResult {
  if (notebookDay == null || notebookDay === "") {
    return { ok: false, errors: { notebookDay: "Notebook day é obrigatório." } };
  }

  if (!isValidNotebookDay(notebookDay)) {
    return { ok: false, errors: { notebookDay: "Notebook day inválido." } };
  }

  return { ok: true, value: notebookDay };
}

export function validateCreateNoteInput(input: CreateNoteInput): CreateNoteValidationResult {
  const result = createNoteSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: zodFieldErrors(result.error) };
}

export function validateUpdateNoteInput(input: UpdateNoteInput): UpdateNoteValidationResult {
  const result = updateNoteSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: zodFieldErrors(result.error) };
}

const quickNoteTextField = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, "Texto da quick note é obrigatório."));

export const quickNoteSchema = z.object({
  text: quickNoteTextField
});

export type QuickNoteInput = z.input<typeof quickNoteSchema>;
export type ValidatedQuickNoteInput = z.output<typeof quickNoteSchema>;

export type QuickNoteValidationResult =
  | { ok: true; value: ValidatedQuickNoteInput }
  | { ok: false; errors: Record<string, string> };

export function validateQuickNoteInput(input: QuickNoteInput): QuickNoteValidationResult {
  const result = quickNoteSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: zodFieldErrors(result.error) };
}

export function validateAppendedNoteBody(body: string): UpdateNoteValidationResult {
  return validateUpdateNoteInput({ body });
}
