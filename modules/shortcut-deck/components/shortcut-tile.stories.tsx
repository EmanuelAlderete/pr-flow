import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Shortcut } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

import { ShortcutTile } from "./shortcut-tile";

const internalShortcut: Shortcut = {
  id: "atalho-prs",
  label: "Pull requests",
  url: "/prs",
  iconId: "github",
  colorId: "ember",
  sortOrder: 0
};

const externalShortcut: Shortcut = {
  id: "atalho-slack",
  label: "Slack do time",
  url: "https://jusfy.slack.com",
  iconId: "slack",
  colorId: "violet",
  sortOrder: 0
};

const meta = {
  title: "Shortcuts/ShortcutTile",
  component: ShortcutTile,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  args: {
    shortcut: internalShortcut
  }
} satisfies Meta<typeof ShortcutTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const External: Story = {
  args: {
    shortcut: externalShortcut
  }
};
