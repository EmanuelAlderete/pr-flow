import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { NotebookDayPicker } from "./notebook-day-picker";

const notebookDay = "2026-10-16";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function installNoteDaysFetch(): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const url = requestUrl(input);
    if (url.includes("/api/journal/note-days")) {
      return Response.json({
        notebookDays: ["2026-10-13", "2026-10-14", "2026-10-15", notebookDay]
      });
    }

    return Response.json({ notebookDays: [] });
  };

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Journal/NotebookDayPicker",
  component: NotebookDayPicker,
  args: {
    id: "notebook-day",
    value: notebookDay,
    onChange: fn()
  },
  beforeEach: () => installNoteDaysFetch()
} satisfies Meta<typeof NotebookDayPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Dia do caderno" }));
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
