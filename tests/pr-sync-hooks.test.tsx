import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrMonitorSync } from "@/modules/prs/hooks/use-pr-monitor-sync";
import { usePrReviewerQueueSync } from "@/modules/prs/hooks/use-pr-reviewer-queue-sync";

const monitorOk = {
  status: "ok" as const,
  fetchedAt: "2026-08-03T12:00:00Z",
  githubLogin: "rigon",
  data: []
};

const queueOk = {
  status: "ok" as const,
  fetchedAt: "2026-08-03T12:00:00Z",
  githubLogin: "rigon",
  data: []
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("usePrMonitorSync", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads with GET on mount and refreshes with POST", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => monitorOk
    } as Response);

    const { result } = renderHook(() => usePrMonitorSync());

    await waitFor(() => {
      expect(result.current.response?.status).toBe("ok");
    });
    expect(fetch).toHaveBeenCalledWith("/api/prs", { method: "GET", cache: "no-store" });

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetch).toHaveBeenCalledWith("/api/prs", { method: "POST", cache: "no-store" });
  });

  it("sets isFetching while refresh is in flight", async () => {
    const sync = deferred<Response>();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => monitorOk
      } as Response)
      .mockImplementationOnce(() => sync.promise);

    const { result } = renderHook(() => usePrMonitorSync());

    await waitFor(() => {
      expect(result.current.response?.status).toBe("ok");
    });

    let refreshPromise: Promise<unknown>;
    act(() => {
      refreshPromise = result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });

    await act(async () => {
      sync.resolve({
        ok: true,
        json: async () => monitorOk
      } as Response);
      await refreshPromise;
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe("usePrReviewerQueueSync", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads queue with GET on mount", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => queueOk
    } as Response);

    const { result } = renderHook(() => usePrReviewerQueueSync());

    await waitFor(() => {
      expect(result.current.response?.status).toBe("ok");
    });
    expect(fetch).toHaveBeenCalledWith("/api/prs/reviewer-queue", {
      method: "GET",
      cache: "no-store"
    });
  });

  it("refresh syncs via POST then reloads queue", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => queueOk
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => monitorOk
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...queueOk,
          fetchedAt: "2026-08-03T12:05:00Z"
        })
      } as Response);

    const { result } = renderHook(() => usePrReviewerQueueSync());

    await waitFor(() => {
      expect(result.current.response?.status).toBe("ok");
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/prs", { method: "POST", cache: "no-store" });
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/prs/reviewer-queue", {
      method: "GET",
      cache: "no-store"
    });
    expect(result.current.response).toMatchObject({ fetchedAt: "2026-08-03T12:05:00Z" });
  });

  it("sets isFetching while refresh sync is in flight", async () => {
    const sync = deferred<Response>();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => queueOk
      } as Response)
      .mockImplementationOnce(() => sync.promise);

    const { result } = renderHook(() => usePrReviewerQueueSync());

    await waitFor(() => {
      expect(result.current.response?.status).toBe("ok");
    });

    let refreshPromise: Promise<unknown>;
    act(() => {
      refreshPromise = result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });

    await act(async () => {
      sync.resolve({
        ok: true,
        json: async () => monitorOk
      } as Response);
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => queueOk
      } as Response);
      await refreshPromise;
    });

    expect(result.current.isFetching).toBe(false);
  });
});
