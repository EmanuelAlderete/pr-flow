import { vi } from "vitest";

const followUpPayload = {
  notebookDay: "2026-05-28",
  windowOpen: true,
  script: {
    status: "draft" as const,
    content: {
      yesterday: "Ontem na varredura",
      today: "sem próximo passo visível",
      blocker: "sem bloqueio"
    }
  },
  summary: null
};

/** Answers follow-up fetches so note requests keep the order the test expects. */
export function mockJournalFetch(
  noteResponses: Array<{ body: unknown; status?: number }>
) {
  const queue = [...noteResponses];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/journal/follow-up")) {
      return {
        ok: true,
        status: 200,
        json: async () => followUpPayload
      };
    }

    const next = queue.shift();
    return {
      ok: true,
      status: next?.status ?? 200,
      json: async () => next?.body
    };
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function noteFetchCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter((call) => !String(call[0]).includes("/api/journal/follow-up"));
}
