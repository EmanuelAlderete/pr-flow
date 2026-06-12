import { PageHeader } from "@/components/layout/page-header";
import { OpenPrWizard } from "@/modules/prs/components/open-pr-wizard";

export default function OpenPrPage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Abrir PR"
        description="Selecione repositório e branch, gere a descrição com IA e abra a pull request no GitHub."
      />
      <OpenPrWizard />
    </div>
  );
}
