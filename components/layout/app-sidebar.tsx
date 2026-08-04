"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  FileText,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  Ticket,
  Container,
  Timer,
  Wrench
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { NotificationPreferencesTrigger } from "@/modules/notifications/components/notification-preferences-dialog";
import { usePendingReviewCount } from "@/modules/notifications/hooks/use-pending-review-count";
import { SidebarAmbientPanel } from "@/modules/vacation-countdown/components/sidebar-ambient-panel";
import { useGithubLogin } from "@/modules/prs/hooks/use-github-login";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare
  },
  {
    title: "Jira",
    href: "/jira",
    icon: Ticket
  },
  {
    title: "Journal",
    href: "/journal",
    icon: BookOpen
  },
  {
    title: "Resumos",
    href: "/summaries",
    icon: FileText
  }
] as const;

function userInitials(login: string) {
  return login.slice(0, 2).toUpperCase();
}

interface AppSidebarProps {
  initialGithubLogin?: string;
}

export function AppSidebar({ initialGithubLogin }: AppSidebarProps) {
  const pathname = usePathname();
  const githubLogin = useGithubLogin(initialGithubLogin);
  const pendingReviewCount = usePendingReviewCount();
  const displayName = githubLogin ?? "Carregando...";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 border-b border-sidebar-border group-data-[collapsible=icon]:gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} tooltip={displayName}>
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-sidebar-primary text-sidebar-primary-foreground shadow-[inset_0_1px_0_rgba(255,200,150,0.15)]">
                {githubLogin ? (
                  <span className="text-xs font-semibold tracking-wide">{userInitials(githubLogin)}</span>
                ) : (
                  <GitPullRequest className="size-4" />
                )}
              </div>
              <span className="truncate font-medium">{displayName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarAmbientPanel />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    render={<Link href={item.href} />}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/prs" || pathname.startsWith("/prs/")}
                  render={<Link href="/prs" />}
                  tooltip="Pull Requests"
                >
                  <GitPullRequest />
                  <span>Pull Requests</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/prs"}
                      render={<Link href="/prs" />}
                    >
                      Minhas PRs
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/prs/reviews")}
                      render={<Link href="/prs/reviews" />}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span>Para revisar</span>
                        {pendingReviewCount > 0 ? (
                          <span
                            className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold text-white"
                            aria-label={`${pendingReviewCount} PRs pendentes de revisão`}
                          >
                            {pendingReviewCount}
                          </span>
                        ) : null}
                      </span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/prs/open")}
                      render={<Link href="/prs/open" />}
                    >
                      Abrir PR
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NotificationPreferencesTrigger />
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>Devtools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    pathname === "/devtools/crons" || pathname.startsWith("/devtools/crons/")
                  }
                  render={<Link href="/devtools/crons" />}
                  tooltip="Forçar execução de crons"
                >
                  <Timer />
                  <span>Crons</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    pathname === "/devtools/repositories" ||
                    pathname.startsWith("/devtools/repositories/")
                  }
                  render={<Link href="/devtools/repositories" />}
                  tooltip="Repositórios GitHub monitorados"
                >
                  <GitBranch />
                  <span>Repositórios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    pathname === "/devtools/local-docker" ||
                    pathname.startsWith("/devtools/local-docker/")
                  }
                  render={<Link href="/devtools/local-docker" />}
                  tooltip="Portainer e stack Docker local Jusfy"
                >
                  <Container />
                  <span>Ambiente local</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--app-text-muted)] group-data-[collapsible=icon]:hidden">
          <Wrench className="size-3 shrink-0 opacity-70" aria-hidden />
          <span>Ferramentas internas</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
