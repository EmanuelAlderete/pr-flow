import { PageHeader } from "@/components/layout/page-header";
import { JournalPage } from "@/modules/journal/components/journal-page";

export default function JournalRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Journal"
        description="Anotações pessoais por Notebook day — uma Note por dia, em Markdown, sem vínculo com Tasks ou PRs."
      />
      <JournalPage />
    </div>
  );
}
