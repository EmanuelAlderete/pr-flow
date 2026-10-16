import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  clearShortcutDeck,
  saveShortcutDeck,
  SHORTCUT_DECK_STORAGE_KEY,
  SHORTCUT_DECK_UPDATED_EVENT
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";
import type { ShortcutDeckStored } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

import { ShortcutDeckManageDialog } from "./shortcut-deck-manage-dialog";

const deckFixture: ShortcutDeckStored = {
  shortcuts: [
    {
      id: "atalho-slack",
      label: "Slack do time",
      url: "https://jusfy.slack.com",
      iconId: "slack",
      colorId: "violet",
      sortOrder: 0
    },
    {
      id: "atalho-jira",
      label: "Jira",
      url: "https://jusfy.atlassian.net/jira",
      iconId: "jira",
      colorId: "sky",
      sortOrder: 1
    },
    {
      id: "atalho-prs",
      label: "Pull requests",
      url: "/prs",
      iconId: "github",
      colorId: "ember",
      sortOrder: 2
    }
  ]
};

function withShortcutDeck(deck: ShortcutDeckStored | null): () => void {
  const previous = window.localStorage.getItem(SHORTCUT_DECK_STORAGE_KEY);
  if (deck === null) {
    clearShortcutDeck();
  } else {
    saveShortcutDeck(deck);
  }

  return () => {
    if (previous === null) {
      window.localStorage.removeItem(SHORTCUT_DECK_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SHORTCUT_DECK_STORAGE_KEY, previous);
    }
    window.dispatchEvent(new Event(SHORTCUT_DECK_UPDATED_EVENT));
  };
}

const meta = {
  title: "Shortcuts/ShortcutDeckManageDialog",
  component: ShortcutDeckManageDialog,
  args: {
    open: true,
    onOpenChange: () => undefined
  },
  beforeEach: () => withShortcutDeck(deckFixture)
} satisfies Meta<typeof ShortcutDeckManageDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => withShortcutDeck(null)
};
