import type { OpenPrBranchesResult } from "@/modules/prs/lib/open-pr/open-pr-types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  result: Extract<OpenPrBranchesResult, { status: "ok" }>;
};

const cacheByRepository = new Map<string, CacheEntry>();

export function getCachedOpenPrBranches(
  repository: string
): Extract<OpenPrBranchesResult, { status: "ok" }> | null {
  const entry = cacheByRepository.get(repository);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cacheByRepository.delete(repository);
    return null;
  }
  return entry.result;
}

export function setCachedOpenPrBranches(
  repository: string,
  result: Extract<OpenPrBranchesResult, { status: "ok" }>
): void {
  cacheByRepository.set(repository, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
}

export function clearOpenPrBranchCache(repository?: string): void {
  if (repository) {
    cacheByRepository.delete(repository);
    return;
  }
  cacheByRepository.clear();
}
