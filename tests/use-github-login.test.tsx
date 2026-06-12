import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGithubLogin } from "@/modules/prs/hooks/use-github-login";
import { PR_MONITOR_SYNC_UPDATED_EVENT } from "@/modules/prs/lib/pr-monitor-cache";

describe("useGithubLogin", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses initialGithubLogin without fetching", async () => {
    const { result } = renderHook(() => useGithubLogin("rigon"));
    expect(result.current).toBe("rigon");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads login from API when no initial value", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ githubLogin: "dev" })
    } as Response);

    const { result } = renderHook(() => useGithubLogin());

    await waitFor(() => {
      expect(result.current).toBe("dev");
    });
  });

  it("updates from localStorage after monitor sync event", async () => {
    const { result } = renderHook(() => useGithubLogin());

    localStorage.setItem(
      "pr-flow:last-sync",
      JSON.stringify({
        status: "ok",
        fetchedAt: "2026-05-28T12:00:00Z",
        githubLogin: "cached-user",
        data: []
      })
    );

    window.dispatchEvent(new Event(PR_MONITOR_SYNC_UPDATED_EVENT));

    await waitFor(() => {
      expect(result.current).toBe("cached-user");
    });
  });
});
