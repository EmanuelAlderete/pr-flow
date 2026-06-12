import { getJiraBrowseUrl } from "@/modules/jira-issue-key";
import { adfToPlainText, extractFigmaUrls, normalizePlainText } from "@/modules/jira/lib/jira-adf";
import { jiraFetch } from "@/modules/jira/lib/jira-client";
import type { JiraIssueDetailDto, JiraIssueTimeProgressDto } from "@/modules/jira/lib/domain";

const ISSUE_DETAIL_FIELDS = [
  "summary",
  "description",
  "comment",
  "timetracking",
  "timeoriginalestimate",
  "customfield_10058"
] as const;

type JiraComment = {
  created?: string;
  author?: { displayName?: string };
  body?: unknown;
};

type JiraTimeTracking = {
  originalEstimate?: string | null;
  remainingEstimate?: string | null;
  timeSpent?: string | null;
  originalEstimateSeconds?: number | null;
  remainingEstimateSeconds?: number | null;
  timeSpentSeconds?: number | null;
};

type JiraDesignFieldItem = {
  url?: string;
  displayName?: string;
};

type JiraIssueDetailResponse = {
  key: string;
  fields: {
    summary: string;
    description?: unknown;
    comment?: { comments?: JiraComment[] };
    timetracking?: JiraTimeTracking | null;
    timeoriginalestimate?: number | null;
    customfield_10058?: JiraDesignFieldItem[] | null;
  };
};

function formatHours(timetracking: JiraTimeTracking | null | undefined, originalSeconds: number | null | undefined): string | null {
  const parts: string[] = [];

  if (timetracking?.originalEstimate && timetracking.originalEstimate !== "0m") {
    parts.push(`Estimativa: ${timetracking.originalEstimate}`);
  } else if (typeof originalSeconds === "number" && originalSeconds > 0) {
    const hours = originalSeconds / 3600;
    parts.push(`Estimativa: ${hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`}`);
  }

  if (timetracking?.timeSpent && timetracking.timeSpent !== "0m") {
    parts.push(`Gasto: ${timetracking.timeSpent}`);
  }

  if (timetracking?.remainingEstimate && timetracking.remainingEstimate !== "0m") {
    parts.push(`Restante: ${timetracking.remainingEstimate}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatSecondsLabel(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

function mapTimeProgress(
  timetracking: JiraTimeTracking | null | undefined,
  originalSeconds: number | null | undefined
): JiraIssueTimeProgressDto | null {
  const estimateSeconds = Math.max(
    0,
    timetracking?.originalEstimateSeconds ?? originalSeconds ?? 0
  );
  const spentSeconds = Math.max(0, timetracking?.timeSpentSeconds ?? 0);
  const remainingSeconds =
    typeof timetracking?.remainingEstimateSeconds === "number"
      ? Math.max(0, timetracking.remainingEstimateSeconds)
      : estimateSeconds > 0
        ? Math.max(0, estimateSeconds - spentSeconds)
        : null;

  if (estimateSeconds <= 0 && spentSeconds <= 0) {
    return null;
  }

  const estimateLabel =
    timetracking?.originalEstimate && timetracking.originalEstimate !== "0m"
      ? timetracking.originalEstimate
      : estimateSeconds > 0
        ? formatSecondsLabel(estimateSeconds)
        : "—";

  const spentLabel =
    timetracking?.timeSpent && timetracking.timeSpent !== "0m"
      ? timetracking.timeSpent
      : spentSeconds > 0
        ? formatSecondsLabel(spentSeconds)
        : "0m";

  const remainingLabel =
    timetracking?.remainingEstimate && timetracking.remainingEstimate !== "0m"
      ? timetracking.remainingEstimate
      : remainingSeconds !== null && remainingSeconds > 0
        ? formatSecondsLabel(remainingSeconds)
        : remainingSeconds === 0
          ? "0m"
          : null;

  const percent =
    estimateSeconds > 0 ? Math.round((spentSeconds / estimateSeconds) * 100) : spentSeconds > 0 ? 100 : 0;

  return {
    estimateSeconds,
    spentSeconds,
    remainingSeconds,
    estimateLabel,
    spentLabel,
    remainingLabel,
    percent
  };
}

function pickLatestComment(comments: JiraComment[] | undefined): JiraIssueDetailDto["latestComment"] {
  if (!comments?.length) {
    return null;
  }

  const sorted = [...comments].sort((a, b) => {
    const aTime = Date.parse(a.created ?? "");
    const bTime = Date.parse(b.created ?? "");
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  const latest = sorted[0];
  const body = normalizePlainText(adfToPlainText(latest.body));

  if (!body) {
    return null;
  }

  return {
    authorName: latest.author?.displayName?.trim() || null,
    created: latest.created ?? null,
    body
  };
}

function resolveFigmaUrls(description: unknown, designField: JiraDesignFieldItem[] | null | undefined): string[] {
  const fromDescription = extractFigmaUrls(description);
  const fromDesign = (designField ?? [])
    .map((item) => item.url?.trim())
    .filter((url): url is string => Boolean(url));

  return [...new Set([...fromDescription, ...fromDesign])];
}

export async function fetchJiraIssueDetail(issueKey: string): Promise<JiraIssueDetailDto> {
  const normalizedKey = issueKey.trim().toUpperCase();
  const fields = ISSUE_DETAIL_FIELDS.join(",");
  const issue = await jiraFetch<JiraIssueDetailResponse>(
    `/issue/${encodeURIComponent(normalizedKey)}?fields=${encodeURIComponent(fields)}`
  );

  const descriptionPlain = normalizePlainText(adfToPlainText(issue.fields.description));
  const figmaUrls = resolveFigmaUrls(issue.fields.description, issue.fields.customfield_10058);

  return {
    key: issue.key,
    summary: issue.fields.summary,
    description: descriptionPlain || null,
    figmaUrls,
    hours: formatHours(issue.fields.timetracking, issue.fields.timeoriginalestimate),
    timeProgress: mapTimeProgress(issue.fields.timetracking, issue.fields.timeoriginalestimate),
    latestComment: pickLatestComment(issue.fields.comment?.comments),
    browseUrl: getJiraBrowseUrl(issue.key),
    cachedAt: null
  };
}
