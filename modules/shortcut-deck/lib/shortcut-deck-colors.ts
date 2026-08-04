import type { ShortcutColorId } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

export type ShortcutColorTokens = {
  id: ShortcutColorId;
  label: string;
  /** Icon foreground */
  fg: string;
  /** Soft fill behind icon */
  bg: string;
  /** Border around icon chip */
  border: string;
};

export const SHORTCUT_COLOR_TOKENS: Record<ShortcutColorId, ShortcutColorTokens> = {
  ember: {
    id: "ember",
    label: "Laranja",
    fg: "var(--brand-bright)",
    bg: "var(--brand-dim)",
    border: "var(--brand-border)"
  },
  sky: {
    id: "sky",
    label: "Azul",
    fg: "#7dd3fc",
    bg: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.42)"
  },
  emerald: {
    id: "emerald",
    label: "Verde",
    fg: "#6ee7b7",
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.42)"
  },
  violet: {
    id: "violet",
    label: "Violeta",
    fg: "#c4b5fd",
    bg: "rgba(167, 139, 250, 0.14)",
    border: "rgba(167, 139, 250, 0.42)"
  },
  rose: {
    id: "rose",
    label: "Rosa",
    fg: "#fda4af",
    bg: "rgba(251, 113, 133, 0.14)",
    border: "rgba(251, 113, 133, 0.42)"
  },
  amber: {
    id: "amber",
    label: "Âmbar",
    fg: "#fcd34d",
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.42)"
  },
  cyan: {
    id: "cyan",
    label: "Ciano",
    fg: "#67e8f9",
    bg: "rgba(34, 211, 238, 0.14)",
    border: "rgba(34, 211, 238, 0.42)"
  },
  slate: {
    id: "slate",
    label: "Cinza",
    fg: "#cbd5e1",
    bg: "rgba(148, 163, 184, 0.14)",
    border: "rgba(148, 163, 184, 0.42)"
  }
};

export function getShortcutColorTokens(colorId: ShortcutColorId): ShortcutColorTokens {
  return SHORTCUT_COLOR_TOKENS[colorId];
}
