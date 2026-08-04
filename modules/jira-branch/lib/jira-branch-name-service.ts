import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  generateLlmText,
  hasLlmApiKey
} from "@/modules/llm-generation";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { loadJiraBranchNamingContext } from "@/modules/jira-branch/lib/jira-branch-context";
import { buildJiraBranchSlugPrompt } from "@/modules/jira-branch/lib/jira-branch-name-prompt";
import {
  buildTicketBranchName,
  resolveBranchPrefixFromIssueType
} from "@/modules/jira-branch/lib/jira-branch-prefix";
import { normalizeLlmBranchSlug } from "@/modules/jira-branch/lib/jira-branch-slug";

const JIRA_BRANCH_SUGGEST_LOG_SOURCE = "jira-branch:suggest";

export type JiraBranchSuggestResult =
  | {
      status: "ok";
      prefix: "feat" | "fix";
      slug: string;
      branchName: string;
      aiAvailable: true;
    }
  | {
      status: "ok";
      prefix: "feat" | "fix";
      slug: string;
      branchName: string;
      aiAvailable: false;
    }
  | { status: "not_found"; message: string }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };

export async function suggestJiraBranchSlug(issueKey: string): Promise<JiraBranchSuggestResult> {
  const context = await loadJiraBranchNamingContext(issueKey);
  if (!context) {
    return {
      status: "not_found",
      message: "Ticket ainda não está no cache. Aguarde a próxima sincronização do Jira."
    };
  }

  const prefix = resolveBranchPrefixFromIssueType(context.issueTypeName);

  if (!hasLlmApiKey()) {
    return {
      status: "ok",
      prefix,
      slug: "",
      branchName: buildTicketBranchName(prefix, context.issueKey, ""),
      aiAvailable: false
    };
  }

  try {
    const prompt = buildJiraBranchSlugPrompt(context);
    const raw = await generateLlmText(prompt);
    const slug = normalizeLlmBranchSlug(raw);

    if (!slug) {
      return {
        status: "error",
        message: "A IA não retornou um slug válido. Tente gerar novamente ou informe manualmente."
      };
    }

    writeSystemLogFireAndForget({
      level: "info",
      source: JIRA_BRANCH_SUGGEST_LOG_SOURCE,
      message: "Slug de branch sugerido.",
      details: { issueKey: context.issueKey, slug }
    });

    return {
      status: "ok",
      prefix,
      slug,
      branchName: buildTicketBranchName(prefix, context.issueKey, slug),
      aiAvailable: true
    };
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return { status: "rate_limited", message: GEMINI_RATE_LIMIT_USER_MESSAGE };
    }
    if (error instanceof GeminiConfigError) {
      return {
        status: "ok",
        prefix,
        slug: "",
        branchName: buildTicketBranchName(prefix, context.issueKey, ""),
        aiAvailable: false
      };
    }
    if (error instanceof GeminiGenerationError) {
      writeSystemLogFireAndForget({
        level: "error",
        source: JIRA_BRANCH_SUGGEST_LOG_SOURCE,
        message: "Falha ao gerar slug de branch.",
        details: sanitizeErrorForLog(error)
      });
      return {
        status: "error",
        message: "Falha ao gerar nome da branch com IA."
      };
    }

    writeSystemLogFireAndForget({
      level: "error",
      source: JIRA_BRANCH_SUGGEST_LOG_SOURCE,
      message: "Erro inesperado ao sugerir slug.",
      details: sanitizeErrorForLog(error)
    });
    return {
      status: "error",
      message: "Falha ao gerar nome da branch com IA."
    };
  }
}
