import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  generateLlmText,
  hasLlmApiKey
} from "@/modules/llm-generation";
import { sanitizeErrorForLog, sanitizeLogDetails } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import type { CommandRunner } from "@/modules/prs/lib/gh-client";
import { GhCommandError } from "@/modules/prs/lib/gh-client";
import { looksLikeRawDiffOutput } from "@/modules/prs/lib/open-pr/open-pr-body-output";
import { ensureOpenPrBodyJiraHeadingLink } from "@/modules/prs/lib/open-pr/open-pr-body-jira-heading";
import {
  buildOpenPrBodyPrompt,
  buildOpenPrBodyRetryPrompt
} from "@/modules/prs/lib/open-pr/open-pr-body-prompt";
import { summarizeDiffForLlm } from "@/modules/prs/lib/open-pr/open-pr-diff-sanitizer";
import {
  fetchBranchDiff,
  fetchPullRequestTemplate
} from "@/modules/prs/lib/open-pr/gh-open-pr-client";
import type { OpenPrGenerateBodyInput } from "@/modules/prs/lib/open-pr/open-pr-validation";

export type OpenPrGenerateBodyResult =
  | { status: "ok"; body: string }
  | { status: "missing_api_key"; message: string }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };

const OPEN_PR_GENERATE_BODY_LOG_SOURCE = "open-pr:generate-body";
const RAW_DIFF_OUTPUT_MESSAGE =
  "A IA retornou o diff em vez de um resumo. Tente gerar novamente ou edite o corpo manualmente.";

function logGenerateBody(
  level: "info" | "warn" | "error",
  message: string,
  input: OpenPrGenerateBodyInput & { title: string },
  details?: unknown
): void {
  writeSystemLogFireAndForget({
    level,
    source: OPEN_PR_GENERATE_BODY_LOG_SOURCE,
    message,
    details: sanitizeLogDetails({
      repository: input.repository,
      branch: input.branch,
      baseBranch: input.baseBranch,
      title: input.title,
      ...(details !== undefined ? { context: details } : {})
    })
  });
}

async function generateBodyFromSummary(
  input: OpenPrGenerateBodyInput & { title: string },
  template: string,
  changeSummary: string,
  attempt: "initial" | "retry"
): Promise<string> {
  const promptInput = {
    repository: input.repository,
    branch: input.branch,
    baseBranch: input.baseBranch,
    title: input.title,
    template,
    changeSummary
  };

  const prompt =
    attempt === "retry"
      ? buildOpenPrBodyRetryPrompt(promptInput)
      : buildOpenPrBodyPrompt(promptInput);

  return generateLlmText(prompt);
}

export async function generateOpenPrBody(
  input: OpenPrGenerateBodyInput & { title: string },
  run?: CommandRunner
): Promise<OpenPrGenerateBodyResult> {
  if (!hasLlmApiKey()) {
    return {
      status: "missing_api_key",
      message: "Configure GEMINI_API_KEY no .env para gerar o corpo da PR."
    };
  }

  logGenerateBody("info", "Iniciando geração do corpo da PR", input);

  try {
    const [template, rawDiff] = await Promise.all([
      fetchPullRequestTemplate(input.repository, run),
      fetchBranchDiff(input.repository, input.branch, input.baseBranch, run)
    ]);

    if (!rawDiff.trim()) {
      const message = "Diff vazio — não há alterações em relação à branch base.";
      logGenerateBody("error", message, input);
      return { status: "error", message };
    }

    const changeSummary = summarizeDiffForLlm(rawDiff);
    logGenerateBody("info", "Resumo de alterações obtido para geração", input, {
      rawDiffChars: rawDiff.length,
      changeSummaryChars: changeSummary.length,
      fileCount: (changeSummary.match(/^- /gm) ?? []).length
    });

    let rawBody = await generateBodyFromSummary(input, template, changeSummary, "initial");
    if (looksLikeRawDiffOutput(rawBody)) {
      logGenerateBody("warn", "IA retornou diff bruto na primeira tentativa", input, {
        responseChars: rawBody.length,
        attempt: "initial"
      });
      rawBody = await generateBodyFromSummary(input, template, changeSummary, "retry");
    }

    if (looksLikeRawDiffOutput(rawBody)) {
      logGenerateBody("error", RAW_DIFF_OUTPUT_MESSAGE, input, {
        responseChars: rawBody.length,
        attempt: "retry"
      });
      return { status: "error", message: RAW_DIFF_OUTPUT_MESSAGE };
    }

    const body = ensureOpenPrBodyJiraHeadingLink(rawBody, input.title);
    logGenerateBody("info", "Corpo da PR gerado com sucesso", input, {
      bodyChars: body.length
    });
    return { status: "ok", body };
  } catch (error) {
    if (error instanceof GeminiConfigError) {
      return {
        status: "missing_api_key",
        message: "Configure GEMINI_API_KEY no .env para gerar o corpo da PR."
      };
    }
    if (error instanceof GeminiRateLimitError) {
      const message = error.message || GEMINI_RATE_LIMIT_USER_MESSAGE;
      logGenerateBody("warn", message, input, sanitizeErrorForLog(error));
      return { status: "rate_limited", message };
    }
    if (error instanceof GeminiGenerationError) {
      logGenerateBody("error", error.message, input, sanitizeErrorForLog(error));
      return { status: "error", message: error.message };
    }
    if (error instanceof GhCommandError) {
      logGenerateBody("error", error.message, input, sanitizeErrorForLog(error));
      return { status: "error", message: error.message };
    }
    const message = "Falha ao gerar corpo da PR com IA.";
    logGenerateBody("error", message, input, sanitizeErrorForLog(error));
    return { status: "error", message };
  }
}
