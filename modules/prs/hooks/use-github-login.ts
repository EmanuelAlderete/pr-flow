"use client";

import { useEffect, useState } from "react";
import {
  loadPrMonitorLastSync,
  PR_MONITOR_SYNC_UPDATED_EVENT
} from "@/modules/prs/lib/pr-monitor-cache";

function readGithubLoginFromCache(): string | undefined {
  return loadPrMonitorLastSync()?.githubLogin;
}

async function fetchGithubLoginFromApi(): Promise<string | undefined> {
  try {
    const response = await fetch("/api/settings/github-login", { cache: "no-store" });
    if (!response.ok) {
      return undefined;
    }

    const body = (await response.json()) as { githubLogin?: string | null };
    return body.githubLogin?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function useGithubLogin(initialGithubLogin?: string): string | undefined {
  const [githubLogin, setGithubLogin] = useState<string | undefined>(initialGithubLogin);

  useEffect(() => {
    const syncFromCache = () => {
      const fromCache = readGithubLoginFromCache();
      if (fromCache) {
        setGithubLogin(fromCache);
      }
    };

    syncFromCache();
    window.addEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, syncFromCache);
    return () => window.removeEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, syncFromCache);
  }, []);

  useEffect(() => {
    if (initialGithubLogin) {
      return;
    }

    let cancelled = false;

    void fetchGithubLoginFromApi().then((login) => {
      if (!cancelled && login) {
        setGithubLogin(login);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialGithubLogin]);

  return githubLogin;
}
