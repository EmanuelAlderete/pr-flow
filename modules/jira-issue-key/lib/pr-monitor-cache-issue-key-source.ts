import {
  collectJiraIssueKeysFromTexts,
  type JiraIssueKeySource
} from "@/modules/jira-issue-key/lib/issue-key-sources";
import { loadPrMonitorCache } from "@/modules/prs/lib/pr-cache-repository";

export function createPrMonitorCacheIssueKeySource(deps?: {
  loadPrMonitorCache?: typeof loadPrMonitorCache;
}): JiraIssueKeySource {
  const loadCache = deps?.loadPrMonitorCache ?? loadPrMonitorCache;

  return {
    async collectIssueKeys() {
      try {
        const cached = await loadCache();
        if (!cached) {
          return [];
        }
        return collectJiraIssueKeysFromTexts(cached.data.map((pr) => pr.title));
      } catch {
        return [];
      }
    }
  };
}
