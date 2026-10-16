import { ptBR } from "@/modules/messages";
import type { LocalReviewReport } from "@/modules/prs/lib/local-review/local-review-report";

const copy = ptBR.localReview;

const AGENT_ORDER = [
  "correctness",
  "security",
  "contracts",
  "tests",
  "delivery",
  "conventions",
  "second-pass",
  "meta-review"
] as const;

export type LocalReviewAgentId = (typeof AGENT_ORDER)[number];

export type LocalReviewFindingView = {
  location: string;
  href: string | null;
  confidenceLabel: string;
  message: string;
};

export type LocalReviewCheckView = {
  status: "met" | "unmet" | "unclear";
  label: string;
  item: string;
};

export type LocalReviewAgentView = {
  id: string;
  title: string;
  description: string;
  findings: LocalReviewFindingView[];
  note: string | null;
  listTitle: string | null;
  list: string[] | null;
  checks: LocalReviewCheckView[] | null;
  wide: boolean;
};

export type LocalReviewView = {
  summary: string;
  docsLoaded: string[];
  agents: LocalReviewAgentView[];
};

export function localReviewPath(repository: string, prNumber: number): string | null {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repository);
  if (!match) {
    return null;
  }
  return `/prs/${match[1]}/${match[2]}/${prNumber}`;
}

export function buildLocalReviewView(
  report: LocalReviewReport,
  source?: { repository: string; headSha: string }
): LocalReviewView {
  const findingsByAgent = new Map<string, LocalReviewReport["findings"]>();
  for (const finding of report.findings) {
    const current = findingsByAgent.get(finding.agent) ?? [];
    current.push(finding);
    findingsByAgent.set(finding.agent, current);
  }

  const ordered = [
    ...AGENT_ORDER,
    ...[...findingsByAgent.keys()].filter((agent) => !AGENT_ORDER.includes(agent as LocalReviewAgentId))
  ];

  return {
    summary: report.summary.trim(),
    docsLoaded: report.docsLoaded,
    agents: ordered.map((agent) => toAgentView(agent, findingsByAgent.get(agent) ?? [], report, source))
  };
}

function toAgentView(
  agent: string,
  findings: LocalReviewReport["findings"],
  report: LocalReviewReport,
  source?: { repository: string; headSha: string }
): LocalReviewAgentView {
  const known = isKnownAgent(agent);
  const note =
    agent === "second-pass"
      ? report.cleanJustification.trim()
      : agent === "meta-review"
        ? report.metaReview.notes.trim() || null
        : null;
  const list =
    agent === "second-pass"
      ? report.notCommented
      : agent === "meta-review"
        ? report.metaReview.dropped
        : null;
  const checks =
    agent === "delivery"
      ? report.traceability.map((entry) => ({
          status: entry.status,
          label: copy.traceStatus[entry.status],
          item: entry.item.trim()
        }))
      : null;
  const findingViews = findings.map((finding) => toFindingView(finding, source));
  const hasBody = findingViews.length > 0 || Boolean(note) || Boolean(checks?.length) || Boolean(list);

  return {
    id: agent,
    title: known ? copy.agents[agent] : agent,
    description: known ? copy.agentDescriptions[agent] : "",
    findings: findingViews,
    note,
    listTitle:
      agent === "second-pass" ? copy.notCommentedHeading : agent === "meta-review" ? copy.droppedHeading : null,
    list,
    checks,
    wide: hasBody
  };
}

function toFindingView(
  finding: LocalReviewReport["findings"][number],
  source?: { repository: string; headSha: string }
): LocalReviewFindingView {
  const location = finding.line ? `${finding.path}:${finding.line}` : finding.path;
  return {
    location,
    href: source ? blobHref(source.repository, source.headSha, finding.path, finding.line) : null,
    confidenceLabel: copy.confidence(Math.round(finding.confidence * 100)),
    message: finding.message.trim()
  };
}

function isKnownAgent(agent: string): agent is LocalReviewAgentId {
  return AGENT_ORDER.includes(agent as LocalReviewAgentId);
}

function blobHref(repository: string, headSha: string, path: string, line?: number): string {
  const file = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const anchor = line ? `#L${line}` : "";
  return `https://github.com/${repository}/blob/${encodeURIComponent(headSha)}/${file}${anchor}`;
}
