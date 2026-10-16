export const LOCAL_REVIEW_MODEL = "haiku";

export const LOCAL_REVIEW_MODEL_IDS = ["haiku", "sonnet", "opus"] as const;

export type LocalReviewModelId = (typeof LOCAL_REVIEW_MODEL_IDS)[number];

export function isLocalReviewModelId(value: string): value is LocalReviewModelId {
  return (LOCAL_REVIEW_MODEL_IDS as readonly string[]).includes(value);
}
