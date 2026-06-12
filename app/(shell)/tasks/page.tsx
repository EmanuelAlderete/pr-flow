import { PageHeader } from "@/components/layout/page-header";
import { TasksPage } from "@/modules/tasks/components/tasks-page";

export default function TasksRoutePage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Tasks"
        description="Organize trabalho pessoal com tarefas abertas e concluídas na mesma instância local."
      />
      <TasksPage />
    </div>
  );
}
