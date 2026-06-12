import { PageHeader } from "@/components/layout/page-header";
import { PrMonitorPage } from "@/modules/prs/components/pr-monitor-page";
import { isSlackConfigured } from "@/modules/slack/lib/slack-config";

export default function PrsPage() {
  return (
    <div className="app-shell">
      <PageHeader
        title="Minhas PRs"
        description="Acompanhe reviewers, status e sincronização das suas pull requests abertas."
      />
      <PrMonitorPage slackConfigured={isSlackConfigured()} />
    </div>
  );
}
