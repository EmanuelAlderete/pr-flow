import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrLocalReviewUsage } from "@/modules/prs/components/pr-local-review-usage";
import type { LocalReviewUsage } from "@/modules/prs/lib/local-review/local-review-usage";
import { renderWithProviders } from "@/tests/render-with-providers";

function usage(requestedModel: string, ids: string[]): LocalReviewUsage {
  return {
    requestedModel,
    totalCostUsd: 1.31,
    peakContextTokens: 176_078,
    peakModel: ids[0] ?? null,
    models: ids.map((id) => ({
      id,
      inputTokens: 10,
      outputTokens: 20,
      cacheReadInputTokens: 30,
      cacheCreationInputTokens: 40,
      thinkingTokens: 0,
      contextWindow: 1_000_000,
      costUsd: 1
    }))
  };
}

describe("PrLocalReviewUsage", () => {
  it("mostra o modelo escolhido como orquestrador e subagentes", () => {
    renderWithProviders(<PrLocalReviewUsage usage={usage("sonnet", ["claude-sonnet-5-5"])} />);
    expect(screen.getByText("Sonnet · Orquestrador e subagentes")).toBeInTheDocument();
    expect(screen.queryByText("Sonnet · Orquestrador")).not.toBeInTheDocument();
  });

  it("separa orquestrador e subagentes quando a execução usou outro modelo", () => {
    renderWithProviders(
      <PrLocalReviewUsage usage={usage("sonnet", ["claude-haiku-5-5", "claude-sonnet-5-5"])} />
    );
    expect(screen.getByText("Modelo escolhido: Sonnet · Orquestrador e subagentes")).toBeInTheDocument();
    expect(screen.getByText("Sonnet · Orquestrador")).toBeInTheDocument();
    expect(screen.getByText("Haiku · Subagentes")).toBeInTheDocument();
    expect(screen.getByText("Pico da janela dos subagentes 176.078 de 1.000.000 (18%)")).toBeInTheDocument();
  });
});
