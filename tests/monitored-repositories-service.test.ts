import { beforeEach, describe, expect, it, vi } from "vitest";

const countMonitoredRepositories = vi.fn();
const insertMonitoredRepositoriesBatch = vi.fn();

vi.mock("@/modules/prs/lib/monitored-repository-repository", () => ({
  countMonitoredRepositories: (...args: unknown[]) => countMonitoredRepositories(...args),
  insertMonitoredRepositoriesBatch: (...args: unknown[]) => insertMonitoredRepositoriesBatch(...args),
  listMonitoredRepositories: vi.fn().mockResolvedValue([])
}));

import {
  resetMonitoredRepositoriesSeedCache,
  seedMonitoredRepositoriesFromEnvIfEmpty
} from "@/modules/prs/lib/monitored-repositories-service";

describe("seedMonitoredRepositoriesFromEnvIfEmpty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMonitoredRepositoriesSeedCache();
    delete process.env.MONITORED_REPOSITORIES;
  });

  it("nao insere quando ja existem registros", async () => {
    countMonitoredRepositories.mockResolvedValue(2);
    await seedMonitoredRepositoriesFromEnvIfEmpty();
    expect(insertMonitoredRepositoriesBatch).not.toHaveBeenCalled();
  });

  it("importa MONITORED_REPOSITORIES quando tabela vazia", async () => {
    countMonitoredRepositories.mockResolvedValue(0);
    process.env.MONITORED_REPOSITORIES = "acme/a, acme/b";

    await seedMonitoredRepositoriesFromEnvIfEmpty();

    expect(insertMonitoredRepositoriesBatch).toHaveBeenCalledWith([
      { repository: "acme/a", defaultBranch: "master", sortOrder: 0 },
      { repository: "acme/b", defaultBranch: "master", sortOrder: 1 }
    ]);
  });
});
