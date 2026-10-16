import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { PrLocalReviewStartDialog } from "./pr-local-review-start-dialog";

function installFetch(): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    Response.json({
      status: "started",
      message: "Revisão de api #128 começou."
    });

  return () => {
    globalThis.fetch = originalFetch;
  };
}

const meta = {
  title: "PRs/PrLocalReviewStartDialog",
  component: PrLocalReviewStartDialog,
  args: {
    open: true,
    repository: "jusfy/api",
    prNumber: 128,
    onOpenChange: fn(),
    onStarted: fn()
  },
  beforeEach() {
    const restoreFetch = installFetch();
    return () => {
      restoreFetch();
    };
  }
} satisfies Meta<typeof PrLocalReviewStartDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Default: Story = {};
