import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";
import { listActiveTasksMentioningIssueKey } from "@/modules/tasks/lib/task-repository";
import type { WorkContextTask } from "@/modules/work-context/lib/domain";

export async function loadWorkContextTasks(issueKeyInput: string): Promise<WorkContextTask[]> {
  const issueKey = normalizeJiraIssueKey(issueKeyInput);
  const records = await listActiveTasksMentioningIssueKey(issueKey);
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    completed: record.completedAt !== null
  }));
}
