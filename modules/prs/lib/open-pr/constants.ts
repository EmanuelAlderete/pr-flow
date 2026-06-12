export const DEFAULT_OPEN_PR_BASE_BRANCH = "master";

export const DEFAULT_OPEN_PR_REVIEWERS = [
  "pmabatista",
  "leocaldeirajusfy",
  "notliad"
] as const;

export const OPEN_PR_TEMPLATE_PATH = ".github/pull_request_template.md";

/** Limite aproximado do diff enviado ao LLM (caracteres). */
export const OPEN_PR_DIFF_MAX_CHARS = 80_000;
