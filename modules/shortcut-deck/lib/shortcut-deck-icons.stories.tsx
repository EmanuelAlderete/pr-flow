import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHORTCUT_ICON_IDS } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

import { SHORTCUT_ICON_LABELS, ShortcutIcon } from "./shortcut-deck-icons";

const meta = {
  title: "Shortcuts/ShortcutIcon",
  component: ShortcutIcon,
  args: {
    iconId: "link",
    className: "size-5"
  }
} satisfies Meta<typeof ShortcutIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SHORTCUT_ICON_IDS.map((iconId) => (
        <li key={iconId} className="flex items-center gap-2 text-sm text-[var(--app-text)]">
          <ShortcutIcon iconId={iconId} className="size-5" />
          <span>{SHORTCUT_ICON_LABELS[iconId]}</span>
        </li>
      ))}
    </ul>
  )
};
