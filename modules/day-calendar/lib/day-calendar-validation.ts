import { z } from "zod";

export const dayCalendarIcalUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" && url.hostname === "calendar.google.com"
      );
    } catch {
      return false;
    }
  }, "GOOGLE_CALENDAR_ICAL_URL must be an https://calendar.google.com/… URL");

export const dayCalendarEventSchema = z.object({
  uid: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  allDay: z.boolean(),
  location: z.string().nullable()
});

export const dayCalendarResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().min(1),
    events: z.array(dayCalendarEventSchema)
  }),
  z.object({
    status: z.literal("missing_config"),
    message: z.string().min(1)
  }),
  z.object({
    status: z.literal("error"),
    message: z.string().min(1)
  })
]);

export type DayCalendarEvent = z.infer<typeof dayCalendarEventSchema>;
export type DayCalendarResponse = z.infer<typeof dayCalendarResponseSchema>;

const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function parseOptionalDayKey(raw: string | undefined): string | undefined {
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  const parsed = dayKeySchema.safeParse(raw.trim());
  return parsed.success ? parsed.data : undefined;
}
