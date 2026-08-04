import { PageHeader } from "@/components/layout/page-header";
import { LocalDockerPage } from "@/modules/local-docker/components/local-docker-page";

export default function DevtoolsLocalDockerRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Ambiente local"
        description="Ligue o Portainer do stack Jusfy e gerencie containers, stacks e volumes a partir dele."
      />
      <LocalDockerPage />
    </div>
  );
}
