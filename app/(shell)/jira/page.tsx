import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { JiraPage } from "@/modules/jira/components/jira-page";

export default function JiraRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Jira"
        description="Tickets em aberto atribuídos ao seu usuário no Jira Cloud (JIRA_EMAIL)."
      />
      <Suspense fallback={null}>
        <JiraPage />
      </Suspense>
    </div>
  );
}
