import { PageHeader } from "@/components/layout/page-header";
import { CronsPage } from "@/modules/devtools/components/crons-page";

export default function DevtoolsCronsRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Crons"
        description="Fluxos agendados do servidor — execute on-demand digitando a frase de confirmação."
      />
      <CronsPage />
    </div>
  );
}
