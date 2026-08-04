import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { savePrReviewerQueueLastSync } from "@/modules/prs/lib/pr-reviewer-queue-cache";

vi.mock("next/navigation", () => ({
  usePathname: () => "/prs/reviews"
}));

vi.mock("@/modules/prs/hooks/use-github-login", () => ({
  useGithubLogin: () => "dev"
}));

vi.mock("@/modules/vacation-countdown/components/sidebar-ambient-panel", () => ({
  SidebarAmbientPanel: () => null
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false
}));

vi.mock("@/modules/notifications/hooks/use-app-notifications", () => ({
  useAppNotifications: () => ({
    permission: "default",
    requestPermission: vi.fn()
  })
}));

describe("AppSidebar Pull Requests", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows sub-navigation for minhas PRs and para revisar", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    expect(screen.getByRole("link", { name: /^minhas prs$/i })).toHaveAttribute("href", "/prs");
    expect(screen.getByRole("link", { name: /^para revisar$/i })).toHaveAttribute("href", "/prs/reviews");
    expect(screen.getByRole("link", { name: /^abrir pr$/i })).toHaveAttribute("href", "/prs/open");
  });

  it("shows pending review badge when queue has pending items", () => {
    savePrReviewerQueueLastSync({
      status: "ok",
      fetchedAt: "2026-05-29T12:00:00Z",
      githubLogin: "dev",
      data: [
        {
          id: "PR_1",
          number: 1,
          title: "feat",
          url: "https://github.com/acme/a/pull/1",
          repository: "acme/a",
          myReviewStatus: "pending"
        },
        {
          id: "PR_2",
          number: 2,
          title: "fix",
          url: "https://github.com/acme/a/pull/2",
          repository: "acme/a",
          myReviewStatus: "reviewed"
        }
      ]
    });

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    expect(screen.getByLabelText("1 PRs pendentes de revisão")).toHaveTextContent("1");
  });
});
