import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppNotificationProvider } from "@/modules/notifications/components/app-notification-provider";
import { QuickNoteDialog } from "@/components/quick-note/quick-note-dialog";
import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";
import { VacationCountdownBootstrap } from "@/modules/vacation-countdown/components/vacation-setup-dialog";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getGithubLogin } from "@/modules/app/lib/github-login-repository";

export default async function ShellLayout({ children }: Readonly<{ children: ReactNode }>) {
  let initialGithubLogin: string | undefined;
  try {
    initialGithubLogin = (await getGithubLogin()) ?? undefined;
  } catch {
    // Sidebar falls back to client fetch / "Carregando..." when DB is unavailable.
  }

  return (
    <WorkContextProvider>
    <SidebarProvider>
      <AppSidebar initialGithubLogin={initialGithubLogin} />
      <SidebarInset className="bg-transparent">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--app-border)]/70 px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--app-text)] sm:inline">
            PR <span className="text-[var(--brand)]">Flow</span>
          </span>
          <span className="hidden text-xs text-[var(--app-text-muted)] md:inline">
            Cockpit local de PRs, tarefas e journal
          </span>
        </header>
        {children}
      </SidebarInset>
      <QuickNoteDialog />
      <VacationCountdownBootstrap />
      <AppNotificationProvider />
    </SidebarProvider>
    </WorkContextProvider>
  );
}
