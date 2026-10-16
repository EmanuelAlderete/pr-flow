import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, CheckSquare, FileText, GitPullRequest, LayoutDashboard, Ticket, Wrench } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger
} from "./sidebar";

const meta = {
  title: "UI/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

function SidebarStory({
  defaultOpen = true,
  variant = "sidebar",
  collapsible = "icon"
}: {
  defaultOpen?: boolean;
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar variant={variant} collapsible={collapsible}>
        <SidebarHeader>
          <span className="px-2 text-sm font-medium">PR Flow</span>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Módulos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Tasks">
                    <CheckSquare />
                    <span>Tasks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Jira">
                    <Ticket />
                    <span>Jira</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Journal">
                    <BookOpen />
                    <span>Journal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Resumos">
                    <FileText />
                    <span>Resumos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Pull Requests">
                    <GitPullRequest />
                    <span>Pull Requests</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive>
                        <span>Minhas PRs</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <span>Para revisar</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupLabel>Devtools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Crons">
                    <Wrench />
                    <span>Crons</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 p-2">
          <SidebarTrigger />
          <span className="text-sm font-medium">Painel</span>
        </header>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Default: Story = {
  render: () => <SidebarStory />
};

export const Collapsed: Story = {
  render: () => <SidebarStory defaultOpen={false} />
};

export const Floating: Story = {
  render: () => <SidebarStory variant="floating" />
};

export const Inset: Story = {
  render: () => <SidebarStory variant="inset" />
};
