import { z } from "zod";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const trimmedTitle = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Título é obrigatório.")
      .max(TITLE_MAX, `Título deve ter no máximo ${TITLE_MAX} caracteres.`)
  );

const optionalDescription = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value): string | null => {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .pipe(
    z.union([
      z.null(),
      z.string().max(DESCRIPTION_MAX, `Descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`)
    ])
  );

const optionalDueDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value): string | null => {
    if (value == null || value === "") {
      return null;
    }
    return value;
  })
  .pipe(
    z
      .string()
      .nullable()
      .refine((value) => value === null || isValidDateOnly(value), "Due date inválida.")
  );

export const createTaskSchema = z.object({
  title: trimmedTitle,
  description: optionalDescription,
  dueDate: optionalDueDate
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type ValidatedCreateTaskInput = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type ValidatedUpdateTaskInput = z.output<typeof updateTaskSchema>;

export type ValidationResult =
  | { ok: true; value: ValidatedCreateTaskInput }
  | { ok: false; errors: Record<string, string> };

export type UpdateValidationResult =
  | { ok: true; value: ValidatedUpdateTaskInput }
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

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  input: unknown
): { ok: true; value: T } | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: zodFieldErrors(result.error) };
}

export function validateCreateTaskInput(input: CreateTaskInput): ValidationResult {
  return parseWithSchema(createTaskSchema, input);
}

export function validateUpdateTaskInput(input: UpdateTaskInput): UpdateValidationResult {
  return parseWithSchema(updateTaskSchema, input);
}
