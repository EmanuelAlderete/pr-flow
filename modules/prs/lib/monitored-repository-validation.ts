import { z } from "zod";
import { DEFAULT_OPEN_PR_BASE_BRANCH } from "@/modules/prs/lib/open-pr/constants";

export const monitoredRepositorySlugSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Repositório inválido. Use owner/repo.");

export const monitoredRepositoryBranchSchema = z
  .string()
  .trim()
  .min(1, "Branch principal é obrigatória.")
  .max(255, "Nome da branch muito longo.");

export const monitoredRepositoryCreateSchema = z.object({
  repository: monitoredRepositorySlugSchema,
  defaultBranch: monitoredRepositoryBranchSchema.default(DEFAULT_OPEN_PR_BASE_BRANCH),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional()
});

export const monitoredRepositoryUpdateSchema = z
  .object({
    repository: monitoredRepositorySlugSchema.optional(),
    defaultBranch: monitoredRepositoryBranchSchema.optional(),
    sortOrder: z.coerce.number().int().min(0).max(10_000).optional()
  })
  .refine(
    (value) =>
      value.repository !== undefined ||
      value.defaultBranch !== undefined ||
      value.sortOrder !== undefined,
    { message: "Informe ao menos um campo para atualizar." }
  );

export type MonitoredRepositoryCreateInput = z.infer<typeof monitoredRepositoryCreateSchema>;
export type MonitoredRepositoryUpdateInput = z.infer<typeof monitoredRepositoryUpdateSchema>;

export function formatMonitoredRepositoryZodError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
