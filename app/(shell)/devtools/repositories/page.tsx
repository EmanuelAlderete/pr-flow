import { PageHeader } from "@/components/layout/page-header";
import { RepositoriesPage } from "@/modules/devtools/components/repositories-page";

export default function DevtoolsRepositoriesRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Repositórios"
        description="Repositórios GitHub monitorados e branch principal para sync de PRs e abertura de pull requests."
      />
      <RepositoriesPage />
    </div>
  );
}
