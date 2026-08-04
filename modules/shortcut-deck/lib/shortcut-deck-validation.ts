import { z } from "zod";

export const SHORTCUT_DECK_MAX = 16;

export const SHORTCUT_ICON_IDS = [
  "slack",
  "github",
  "gitlab",
  "argo",
  "aws",
  "parameter-store",
  "jira",
  "confluence",
  "grafana",
  "docker",
  "kubernetes",
  "terminal",
  "link"
] as const;

export const SHORTCUT_COLOR_IDS = [
  "ember",
  "sky",
  "emerald",
  "violet",
  "rose",
  "amber",
  "cyan",
  "slate"
] as const;

export type ShortcutIconId = (typeof SHORTCUT_ICON_IDS)[number];
export type ShortcutColorId = (typeof SHORTCUT_COLOR_IDS)[number];

export function isValidShortcutUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.length >= 1;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalShortcutUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export const shortcutIconIdSchema = z.enum(SHORTCUT_ICON_IDS);
export const shortcutColorIdSchema = z.enum(SHORTCUT_COLOR_IDS);

export const shortcutSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1).max(40),
  url: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine(isValidShortcutUrl, "Invalid shortcut URL"),
  iconId: shortcutIconIdSchema,
  colorId: shortcutColorIdSchema,
  sortOrder: z.number().int().min(0).max(999)
});

export const shortcutDeckStoredSchema = z.object({
  shortcuts: z.array(shortcutSchema).max(SHORTCUT_DECK_MAX)
});

export type Shortcut = z.infer<typeof shortcutSchema>;
export type ShortcutDeckStored = z.infer<typeof shortcutDeckStoredSchema>;

export function sortShortcuts(shortcuts: readonly Shortcut[]): Shortcut[] {
  return [...shortcuts].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}
