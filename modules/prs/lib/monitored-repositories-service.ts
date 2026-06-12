import { DEFAULT_OPEN_PR_BASE_BRANCH } from "@/modules/prs/lib/open-pr/constants";
import {
  countMonitoredRepositories,
  insertMonitoredRepositoriesBatch,
  listMonitoredRepositories,
  type MonitoredRepositoryRecord
} from "@/modules/prs/lib/monitored-repository-repository";
import { parseMonitoredRepositories } from "@/modules/prs/lib/repositories";

const NO_REPOSITORIES_MESSAGE =
  "Cadastre repositórios em Devtools → Repositórios (formato owner/repo).";

let seedPromise: Promise<void> | null = null;

export async function seedMonitoredRepositoriesFromEnvIfEmpty(): Promise<void> {
  const count = await countMonitoredRepositories();
  if (count > 0) {
    return;
  }

  const fromEnv = parseMonitoredRepositories(process.env.MONITORED_REPOSITORIES);
  if (fromEnv.length === 0) {
    return;
  }

  await insertMonitoredRepositoriesBatch(
    fromEnv.map((repository, index) => ({
      repository,
      defaultBranch: DEFAULT_OPEN_PR_BASE_BRANCH,
      sortOrder: index
    }))
  );
}

export async function ensureMonitoredRepositoriesReady(): Promise<void> {
  seedPromise ??= seedMonitoredRepositoriesFromEnvIfEmpty();
  await seedPromise;
}

export async function listMonitoredRepositoriesForApp(): Promise<MonitoredRepositoryRecord[]> {
  await ensureMonitoredRepositoriesReady();
  return listMonitoredRepositories();
}

export async function getMonitoredRepositorySlugsForSync(): Promise<string[]> {
  await ensureMonitoredRepositoriesReady();
  const rows = await listMonitoredRepositories();
  return rows.map((row) => row.repository);
}

export function noMonitoredRepositoriesMessage(): string {
  return NO_REPOSITORIES_MESSAGE;
}

/** Reseta cache de seed (testes). */
export function resetMonitoredRepositoriesSeedCache(): void {
  seedPromise = null;
}
