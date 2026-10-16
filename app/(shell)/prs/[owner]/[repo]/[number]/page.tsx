import { notFound } from "next/navigation";
import { PrLocalReviewPage } from "@/modules/prs/components/pr-local-review-page";
import { localReviewPageParamsSchema } from "@/modules/prs/lib/local-review/local-review-page-validation";
import { loadLocalReviewReading } from "@/modules/prs/lib/local-review/local-review-reading";

export default async function LocalReviewRoutePage({
  params
}: {
  params: Promise<{ owner: string; repo: string; number: string }>;
}) {
  const parsed = localReviewPageParamsSchema.safeParse(await params);
  if (!parsed.success) {
    notFound();
  }

  const reading = await loadLocalReviewReading(
    `${parsed.data.owner}/${parsed.data.repo}`,
    parsed.data.number
  );

  return <PrLocalReviewPage reading={reading} />;
}
