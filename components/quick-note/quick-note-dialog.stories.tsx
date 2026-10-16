import { useEffect, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { screen } from "storybook/test";

import { QuickNoteDialog } from "./quick-note-dialog";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function dispatchQuickNoteShortcut() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: " ",
      code: "Space",
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    })
  );
}

function OpenQuickNote({ children }: { children: ReactNode }) {
  useEffect(() => {
    dispatchQuickNoteShortcut();
  }, []);

  return children;
}

const meta = {
  title: "Layout/QuickNoteDialog",
  component: QuickNoteDialog,
  decorators: [
    (Story) => (
      <OpenQuickNote>
        <Story />
      </OpenQuickNote>
    )
  ],
  async beforeEach() {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = requestUrl(input);

      if (url.includes("/api/journal/quick-note")) {
        return Response.json({ routedBy: "ai", tasks: [] });
      }

      return Response.json({ error: "mocked" }, { status: 404 });
    };

    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof QuickNoteDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async () => {
    dispatchQuickNoteShortcut();
    await screen.findByRole("dialog");
  }
};
