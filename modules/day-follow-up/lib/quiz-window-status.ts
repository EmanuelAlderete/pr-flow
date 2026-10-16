import { resolveSummaryCronTimezone } from "@/modules/cron-scheduling/lib/summary-timezone";
import { createDrizzleFollowUpStore } from "@/modules/day-follow-up/lib/repository";
import { isQuizWindowOpen } from "@/modules/day-follow-up/lib/quiz-window";

export async function isNotebookDayQuizWindowOpen(
  notebookDay: string,
  now: Date = new Date()
): Promise<boolean> {
  const script = await createDrizzleFollowUpStore().getScript(notebookDay);
  return isQuizWindowOpen({
    notebookDay,
    now,
    timeZone: resolveSummaryCronTimezone(),
    scriptUsed: script?.status === "used"
  });
}
