import { PageHeader } from "@/components/layout/page-header";
import { PrReviewerQueuePage } from "@/modules/prs/components/pr-reviewer-queue-page";

export default function PrReviewerQueueRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Para revisar"
        description="Fila pessoal de code review — priorize o que falta avaliar e abra direto no GitHub."
      />
      <PrReviewerQueuePage />
    </div>
  );
}
