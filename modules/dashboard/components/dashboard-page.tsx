"use client";

import { DashboardBriefingWidget } from "@/modules/dashboard/components/dashboard-briefing-widget";
import { DashboardHub } from "@/modules/dashboard/components/dashboard-hub";
import { DashboardTasksWidget } from "@/modules/dashboard/components/dashboard-tasks-widget";
import { DashboardDayCalendarWidget } from "@/modules/day-calendar/components/dashboard-day-calendar-widget";
import { DashboardJournalStreakWidget } from "@/modules/journal/components/dashboard-journal-streak-widget";
import { DashboardShortcutDeck } from "@/modules/shortcut-deck/components/dashboard-shortcut-deck";
import { DashboardVacationWidget } from "@/modules/vacation-countdown/components/dashboard-vacation-widget";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div
        className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
        data-testid="dashboard-personal-widgets-row"
      >
        <div
          className="flex min-w-0 flex-col gap-4"
          data-testid="dashboard-personal-stack"
        >
          <DashboardVacationWidget />
          <DashboardJournalStreakWidget />
        </div>
        <DashboardDayCalendarWidget />
        <DashboardShortcutDeck />
      </div>
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
