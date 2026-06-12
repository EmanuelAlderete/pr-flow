import { PageHeader } from "@/components/layout/page-header";
import { DashboardPage } from "@/modules/dashboard/components/dashboard-page";

export default function DashboardRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Dashboard"
        description="Resumo executivo do dia, atalhos dos módulos e tickets Jira da sprint atual."
      />
      <DashboardPage />
    </div>
  );
}
