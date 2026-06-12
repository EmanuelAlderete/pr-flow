import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

export const quickNoteClassificationSchema = z
  .object({
    destination: z.enum(["task", "journal"]),
    title: z.union([z.string(), z.null()]).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    dueDate: dateOnly
  })
  .superRefine((data, ctx) => {
    if (data.destination !== "task") {
      return;
    }
    const title = data.title?.trim() ?? "";
    if (title.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Título é obrigatório quando destination é task.",
        path: ["title"]
      });
    }
  });

export type QuickNoteClassificationPayload = z.infer<typeof quickNoteClassificationSchema>;

export type ParsedQuickNoteClassification =
  | { destination: "journal" }
  | {
      destination: "task";
      title: string;
      description: string | null;
      dueDate: string | null;
    };

export function toParsedClassification(
  payload: QuickNoteClassificationPayload
): ParsedQuickNoteClassification | null {
  if (payload.destination === "journal") {
    return { destination: "journal" };
  }

  const title = payload.title?.trim() ?? "";
  if (!title) {
    return null;
  }

  const description = payload.description?.trim() ?? "";
  return {
    destination: "task",
    title,
    description: description.length > 0 ? description : null,
    dueDate: payload.dueDate ?? null
  };
}
