import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { NoteDto } from "@/modules/journal/lib/domain";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";

import { JournalPage } from "./journal-page";

const notebookDay = todayLocalDateString();

const existingNote: NoteDto = {
  id: "note-hoje",
  notebookDay,
  body: [
    "## Standup",
    "",
    "- Fechei a revisão do fluxo de alertas.",
    "- O resumo semanal fica para segunda de manhã.",
    "",
    "Decisão: manter o caderno em Markdown e só gerar rascunho quando o dia ainda estiver vazio."
  ].join("\n"),
  createdAt: "2026-10-16T11:00:00.000Z",
  updatedAt: "2026-10-16T11:30:00.000Z"
};

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function installJournalFetch(note: NoteDto | null): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const url = requestUrl(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/journal/note-days")) {
      return Response.json({ notebookDays: note ? [note.notebookDay] : [] });
    }

    if (url.includes("/api/journal/day-draft")) {
      return Response.json({
        status: "ok",
        day: note?.notebookDay ?? notebookDay,
        draft: "### Rascunho\n\nPontos do dia ainda não registrados."
      });
    }

    if (url.includes("/api/journal/notes") && method === "GET") {
      return Response.json({ note });
    }

    if (method === "POST" || method === "PATCH") {
      return Response.json({
        id: note?.id ?? "note-nova",
        notebookDay: note?.notebookDay ?? notebookDay,
        body: note?.body ?? "",
        createdAt: note?.createdAt ?? "2026-10-16T12:00:00.000Z",
        updatedAt: "2026-10-16T12:00:00.000Z"
      });
    }

    return Response.json({ note });
  };

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Journal/JournalPage",
  component: JournalPage,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/journal",
        query: {}
      }
    }
  },
  beforeEach: () => installJournalFetch(null)
} satisfies Meta<typeof JournalPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  beforeEach: () => installJournalFetch(existingNote)
};

export const Empty: Story = {
  beforeEach: () => installJournalFetch(null)
};
