import type { FollowUpStore, QuizAnswerRecord, StandupScriptRecord } from "@/modules/day-follow-up/lib/repository";

export function createMemoryFollowUpStore(): FollowUpStore {
  const scripts = new Map<string, StandupScriptRecord>();
  const answers: QuizAnswerRecord[] = [];
  let sequence = 0;

  return {
    async getScript(notebookDay) {
      return scripts.get(notebookDay) ?? null;
    },
    async saveScript(record) {
      scripts.set(record.notebookDay, record);
      return record;
    },
    async listAnswers(notebookDay) {
      return answers.filter((answer) => answer.notebookDay === notebookDay);
    },
    async insertAnswer(input) {
      sequence += 1;
      const record: QuizAnswerRecord = { ...input, id: `answer-${sequence}` };
      answers.push(record);
      return record;
    }
  };
}
