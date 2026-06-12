import { describe, expect, it } from "vitest";
import { buildOpenPrBodyPrompt } from "@/modules/prs/lib/open-pr/open-pr-body-prompt";

describe("buildOpenPrBodyPrompt", () => {
  it("inclui template e resumo de alterações, sem bloco diff", () => {
    const prompt = buildOpenPrBodyPrompt({
      repository: "acme/app",
      branch: "git_convention/jor-1/feature",
      baseBranch: "master",
      title: "JOR-1 - Feature",
      template: "## O que mudou?",
      changeSummary: "- removido (binário): public/bg.jpg"
    });

    expect(prompt).toContain("JOR-1 - Feature");
    expect(prompt).toContain("## O que mudou?");
    expect(prompt).toContain("removido (binário): public/bg.jpg");
    expect(prompt).not.toContain("```diff");
    expect(prompt).toMatch(/NÃO inclua no resultado/i);
    expect(prompt).toMatch(/jira_link/i);
    expect(prompt).toMatch(/Não invente outros links/i);
    expect(prompt).toMatch(/sem blocos de diff/i);
  });
});
