import { describe, expect, it } from "vitest";
import { grafanaLokiExploreUrl } from "@/modules/observability/lib/grafana-links";

describe("grafanaLokiExploreUrl", () => {
  it("gera query LogQL com label source (sem escapes inválidos em regex)", () => {
    const url = grafanaLokiExploreUrl("cron:prs-sync");
    const panesParam = new URL(url).searchParams.get("panes");
    expect(panesParam).toBeTruthy();

    const panes = JSON.parse(decodeURIComponent(panesParam!)) as {
      a: { queries: Array<{ expr: string }> };
    };
    const expr = panes.a.queries[0]?.expr;

    expect(expr).toBe(
      '{service="app", source="cron:prs-sync"} | json | line_format "{{.message}}"'
    );
    expect(expr).not.toContain("\\\"");
    expect(expr).not.toContain("|~");
  });
});
