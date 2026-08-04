import { z } from "zod";
import { JIRA_BRANCH_SLUG_MAX_LENGTH } from "@/modules/jira-branch/lib/jira-branch-slug";

const repositorySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Repositório inválido. Use owner/repo.");

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug é obrigatório.")
  .max(JIRA_BRANCH_SLUG_MAX_LENGTH, "Slug muito longo.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minúsculas, números e hífens (kebab-case em inglês)."
  );

const baseBranchSchema = z.string().trim().min(1, "Branch base é obrigatória.");

export const jiraBranchCheckSchema = z.object({
  repositories: z.array(repositorySchema).min(1, "Selecione ao menos um repositório."),
  slug: slugSchema
});

export const jiraBranchCreateSchema = z.object({
  slug: slugSchema,
  targets: z
    .array(
      z.object({
        repository: repositorySchema,
        baseBranch: baseBranchSchema
      })
    )
    .min(1, "Selecione ao menos um repositório.")
});

export type JiraBranchCheckInput = z.infer<typeof jiraBranchCheckSchema>;
export type JiraBranchCreateInput = z.infer<typeof jiraBranchCreateSchema>;

export function formatZodError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
