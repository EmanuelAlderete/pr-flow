"use client";

import { DashboardBriefingWidget } from "@/modules/dashboard/components/dashboard-briefing-widget";
import { DashboardHub } from "@/modules/dashboard/components/dashboard-hub";
import { DashboardTasksWidget } from "@/modules/dashboard/components/dashboard-tasks-widget";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHub />
      <div
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)]"
        data-testid="dashboard-briefing-tasks-row"
      >
        <DashboardBriefingWidget />
        <DashboardTasksWidget />
      </div>
    </div>
  );
}
