import { z } from "zod";
import {
  type QuickNoteDateAnchors,
  sanitizeQuickNoteDueDate
} from "@/modules/journal/lib/quick-note-date-anchors";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

export const quickNoteDueRelativeSchema = z.enum([
  "today",
  "tomorrow",
  "end_of_work_week",
  "next_monday"
]);

export type QuickNoteDueRelative = z.infer<typeof quickNoteDueRelativeSchema>;

export const quickNoteTaskDraftSchema = z.object({
  title: z.string(),
  description: z.union([z.string(), z.null()]).optional(),
  dueDate: dateOnly,
  dueRelative: quickNoteDueRelativeSchema.nullable().optional()
});

export const quickNoteClassificationSchema = z.object({
  tasks: z.array(quickNoteTaskDraftSchema).default([])
});

export type QuickNoteClassificationPayload = z.infer<typeof quickNoteClassificationSchema>;

export type QuickNoteTaskDraft = {
  title: string;
  description: string | null;
  dueDate: string | null;
};

export type ParsedQuickNoteClassification = {
  tasks: QuickNoteTaskDraft[];
};

export function resolveDueDateFromClassification(
  draft: {
    dueDate?: string | null;
    dueRelative?: QuickNoteDueRelative | null;
  },
  anchors: QuickNoteDateAnchors
): string | null {
  if (draft.dueRelative) {
    switch (draft.dueRelative) {
      case "today":
        return anchors.today;
      case "tomorrow":
        return anchors.tomorrow;
      case "end_of_work_week":
        return anchors.endOfWorkWeek;
      case "next_monday":
        return anchors.nextMonday;
    }
  }

  return sanitizeQuickNoteDueDate(draft.dueDate ?? null, anchors.today);
}

export function toParsedClassification(
  payload: QuickNoteClassificationPayload,
  anchors: QuickNoteDateAnchors
): ParsedQuickNoteClassification {
  const tasks: QuickNoteTaskDraft[] = [];

  for (const draft of payload.tasks) {
    const title = draft.title?.trim() ?? "";
    if (!title) {
      continue;
    }
    const description = draft.description?.trim() ?? "";
    tasks.push({
      title,
      description: description.length > 0 ? description : null,
      dueDate: resolveDueDateFromClassification(draft, anchors)
    });
  }

  return { tasks };
}
