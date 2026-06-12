const DEFAULT_GRAFANA_URL = "http://localhost:3848";

export function grafanaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_GRAFANA_URL ?? DEFAULT_GRAFANA_URL;
}

export function grafanaLokiExploreUrl(source: string): string {
  const expr = `{service="app", source="${source}"} | json | line_format "{{.message}}"`;
  const panes = {
    a: {
      datasource: "loki",
      queries: [{ refId: "A", expr, queryType: "range" }],
      range: { from: "now-24h", to: "now" }
    }
  };

  return `${grafanaBaseUrl()}/explore?schemaVersion=1&panes=${encodeURIComponent(JSON.stringify(panes))}&orgId=1`;
}
