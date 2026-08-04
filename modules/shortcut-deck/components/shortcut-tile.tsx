"use client";

import Link from "next/link";
import { getShortcutColorTokens } from "@/modules/shortcut-deck/lib/shortcut-deck-colors";
import { ShortcutIcon } from "@/modules/shortcut-deck/lib/shortcut-deck-icons";
import {
  isExternalShortcutUrl,
  type Shortcut
} from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

type ShortcutTileProps = {
  shortcut: Shortcut;
};

export function ShortcutTile({ shortcut }: ShortcutTileProps) {
  const color = getShortcutColorTokens(shortcut.colorId);
  const external = isExternalShortcutUrl(shortcut.url);

  const content = (
    <>
      <span
        className="flex size-10 items-center justify-center rounded-lg border"
        style={{ color: color.fg, backgroundColor: color.bg, borderColor: color.border }}
      >
        <ShortcutIcon iconId={shortcut.iconId} className="size-5" />
      </span>
      <span className="line-clamp-2 text-center text-xs font-medium leading-snug text-[var(--app-text)]">
        {shortcut.label}
      </span>
    </>
  );

  const className =
    "group flex flex-col items-center gap-2 rounded-xl p-2 outline-none transition-[filter,transform] duration-200 hover:brightness-[1.06] hover:-translate-y-px focus-visible:ring-3 focus-visible:ring-ring/50";

  if (external) {
    return (
      <a
        href={shortcut.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid={`shortcut-tile-${shortcut.id}`}
        title={shortcut.label}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={shortcut.url}
      className={className}
      data-testid={`shortcut-tile-${shortcut.id}`}
      title={shortcut.label}
    >
      {content}
    </Link>
  );
}
