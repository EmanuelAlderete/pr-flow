import { z } from "zod";

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const vacationStartDateSchema = z
  .string()
  .regex(dateOnlyRegex, "Invalid date")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }, "Invalid calendar date");

export const vacationCountdownStoredSchema = z.object({
  startDate: vacationStartDateSchema.nullable(),
  promptDismissed: z.boolean().default(false)
});

export type VacationCountdownStored = z.infer<typeof vacationCountdownStoredSchema>;
