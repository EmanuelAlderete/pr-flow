export function parseMonitoredRepositories(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const unique = new Set(
    value
      .split(",")
      .map((repo) => repo.trim())
      .filter((repo) => repo.length > 0)
  );

  return Array.from(unique);
}
