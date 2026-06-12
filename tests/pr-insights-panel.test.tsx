import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrInsightsPanel } from "@/modules/prs/components/pr-insights-panel";
import type { PrInsights } from "@/modules/prs/lib/pr-metrics";

const sampleInsights: PrInsights = {
  openPrCount: 4,
  coolingPrCount: 2,
  averageOpenDays: 3.5,
  pendingReviewCount: 1,
  averageTimeToFirstReviewHours: null
};

describe("PrInsightsPanel", () => {
  it("shows cooling PRs, average open time and pending review count", () => {
    render(<PrInsightsPanel insights={sampleInsights} />);

    expect(screen.getByRole("region", { name: "Insights de PRs" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/PRs esfriando/i)).toBeInTheDocument();
    expect(screen.getByText("3,5 dias")).toBeInTheDocument();
    expect(screen.getByText(/Tempo médio aberto/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Pendentes na fila/i)).toBeInTheDocument();
  });
});
