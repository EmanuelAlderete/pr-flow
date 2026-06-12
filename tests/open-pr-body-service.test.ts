import { beforeEach, describe, expect, it, vi } from "vitest";

const writeSystemLogFireAndForget = vi.fn();
const fetchBranchDiff = vi.fn();
const fetchPullRequestTemplate = vi.fn();
const hasLlmApiKey = vi.fn();
const generateLlmText = vi.fn();

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: (...args: unknown[]) => writeSystemLogFireAndForget(...args)
}));

vi.mock("@/modules/llm-generation", () => ({
  hasLlmApiKey: (...args: unknown[]) => hasLlmApiKey(...args),
  generateLlmText: (...args: unknown[]) => generateLlmText(...args),
  GeminiConfigError: class GeminiConfigError extends Error {},
  GeminiGenerationError: class GeminiGenerationError extends Error {},
  GeminiRateLimitError: class GeminiRateLimitError extends Error {},
  GEMINI_RATE_LIMIT_USER_MESSAGE: "rate limit"
}));

vi.mock("@/modules/prs/lib/open-pr/gh-open-pr-client", () => ({
  fetchBranchDiff: (...args: unknown[]) => fetchBranchDiff(...args),
  fetchPullRequestTemplate: (...args: unknown[]) => fetchPullRequestTemplate(...args)
}));

import { GhCommandError } from "@/modules/prs/lib/gh-client";
import { generateOpenPrBody } from "@/modules/prs/lib/open-pr/open-pr-body-service";

describe("generateOpenPrBody", () => {
  const input = {
    repository: "acme/repo",
    branch: "chore/JOR-251/remove-routes-and-files",
    baseBranch: "main",
    title: "JOR-251 - Remove routes"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hasLlmApiKey.mockReturnValue(true);
    fetchPullRequestTemplate.mockResolvedValue("## O que mudou?");
    fetchBranchDiff.mockResolvedValue("diff --git a/foo b/foo\n-old\n+new");
    generateLlmText.mockResolvedValue("## O que mudou?\n\nRemove rotas.");
  });

  it("persiste erro de diff nos logs do sistema", async () => {
    fetchBranchDiff.mockRejectedValue(new GhCommandError("gh: Not Found (HTTP 404)"));

    const result = await generateOpenPrBody(input);

    expect(result.status).toBe("error");
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "open-pr:generate-body",
        message: "gh: Not Found (HTTP 404)"
      })
    );
  });

  it("rejeita quando a IA devolve diff bruto", async () => {
    generateLlmText
      .mockResolvedValueOnce("diff --git a/public/bg.jpg b/public/bg.jpg")
      .mockResolvedValueOnce("diff --git a/public/bg.jpg b/public/bg.jpg");

    const result = await generateOpenPrBody(input);

    expect(result.status).toBe("error");
    expect(generateLlmText).toHaveBeenCalledTimes(2);
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        source: "open-pr:generate-body",
        message: "IA retornou diff bruto na primeira tentativa"
      })
    );
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "open-pr:generate-body",
        message: expect.stringContaining("diff em vez de um resumo")
      })
    );
  });

  it("aceita resposta válida após retry", async () => {
    generateLlmText
      .mockResolvedValueOnce("diff --git a/public/bg.jpg b/public/bg.jpg")
      .mockResolvedValueOnce("## O que mudou?\n\nRemove arquivos legados.");

    const result = await generateOpenPrBody(input);

    expect(result.status).toBe("ok");
    expect(result).toEqual(
      expect.objectContaining({
        body: expect.stringContaining("Remove arquivos legados")
      })
    );
    expect(generateLlmText).toHaveBeenCalledTimes(2);
  });

  it("registra início e sucesso da geração", async () => {
    const result = await generateOpenPrBody(input);

    expect(result.status).toBe("ok");
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        source: "open-pr:generate-body",
        message: "Iniciando geração do corpo da PR"
      })
    );
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        source: "open-pr:generate-body",
        message: "Corpo da PR gerado com sucesso"
      })
    );
  });
});
