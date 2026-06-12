import { PageHeader } from "@/components/layout/page-header";
import { SummariesPage } from "@/modules/summaries/components/summaries-page";

export default function SummariesRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Resumos"
        description="Histórico de resumos diários e semanais gerados automaticamente à meia-noite."
      />
      <SummariesPage />
    </div>
  );
}
