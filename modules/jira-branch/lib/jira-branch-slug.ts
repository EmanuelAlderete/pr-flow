export const JIRA_BRANCH_SLUG_MAX_LENGTH = 50;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateBranchSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) {
    return "Slug é obrigatório.";
  }
  if (trimmed.length > JIRA_BRANCH_SLUG_MAX_LENGTH) {
    return `Slug muito longo (máx. ${JIRA_BRANCH_SLUG_MAX_LENGTH} caracteres).`;
  }
  if (!SLUG_PATTERN.test(trimmed)) {
    return "Use apenas letras minúsculas, números e hífens (kebab-case em inglês).";
  }
  return null;
}

export function normalizeLlmBranchSlug(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, JIRA_BRANCH_SLUG_MAX_LENGTH).replace(/-+$/g, "");
}
