export function jiraStatusCardClass(statusCategoryKey: string): string {
  if (statusCategoryKey === "done") {
    return "jira-issue-card--done";
  }
  if (statusCategoryKey === "indeterminate") {
    return "jira-issue-card--indeterminate";
  }
  return "jira-issue-card--new";
}

export function jiraStatusPillClass(statusCategoryKey: string): string {
  if (statusCategoryKey === "done") {
    return "jira-issue-card__status--done";
  }
  if (statusCategoryKey === "indeterminate") {
    return "jira-issue-card__status--indeterminate";
  }
  return "jira-issue-card__status--new";
}
