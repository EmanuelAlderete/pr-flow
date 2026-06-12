import type { SummaryType } from "@/modules/summaries/lib/schema";

export type SummaryDto = {
  id: string;
  type: SummaryType;
  periodKey: string;
  content: string;
  generatedAt: string;
};

export type SummaryListResponse = {
  summaries: SummaryDto[];
};
