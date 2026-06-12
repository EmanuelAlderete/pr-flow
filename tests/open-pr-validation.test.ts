import { describe, expect, it } from "vitest";
import { openPrCreateSchema } from "@/modules/prs/lib/open-pr/open-pr-validation";

describe("openPrCreateSchema", () => {
  it("aceita payload valido com revisores padrao", () => {
    const parsed = openPrCreateSchema.parse({
      repository: "acme/repo",
      branch: "git_convention/jor-1/x",
      title: "JOR-1 - Titulo",
      body: "Corpo"
    });

    expect(parsed.reviewers).toEqual(["pmabatista", "leocaldeirajusfy", "notliad"]);
    expect(parsed.baseBranch).toBe("master");
  });

  it("rejeita repositorio invalido", () => {
    const parsed = openPrCreateSchema.safeParse({
      repository: "invalido",
      branch: "x",
      title: "t",
      body: "b"
    });
    expect(parsed.success).toBe(false);
  });
});
