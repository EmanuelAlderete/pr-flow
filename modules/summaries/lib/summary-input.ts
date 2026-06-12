export {
  contextHasSummaryInput,
  dayHasJiraActivityOnDay,
  dayHasPrActivityOnDay,
  dayHasSummaryInput,
  DAILY_SUMMARY_NO_INPUT_MESSAGE,
  hasNotebookContentOnDay
} from "@/modules/notebook-day";

import { dayHasSummaryInput } from "@/modules/notebook-day";
import { WEEKLY_SUMMARY_NO_INPUT_MESSAGE } from "@/modules/messages";
import { weekDayRange } from "@/modules/summaries/lib/summary-period";

export { WEEKLY_SUMMARY_NO_INPUT_MESSAGE };

export async function weekHasSummaryInput(weekMonday: string): Promise<boolean> {
  const days = weekDayRange(weekMonday);
  const results = await Promise.all(days.map((day) => dayHasSummaryInput(day)));
  return results.some(Boolean);
}
