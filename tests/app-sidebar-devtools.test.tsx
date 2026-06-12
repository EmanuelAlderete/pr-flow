import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard"
}));

vi.mock("@/modules/prs/hooks/use-github-login", () => ({
  useGithubLogin: () => "dev"
}));

vi.mock("@/modules/prs/components/weather-forecast", () => ({
  WeatherForecast: () => null
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false
}));

describe("AppSidebar Devtools footer", () => {
  it("shows Crons and Repositories under Devtools", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    expect(screen.getByText("Devtools")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^logs$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^crons$/i })).toHaveAttribute(
      "href",
      "/devtools/crons"
    );
    expect(screen.getByRole("link", { name: /^repositórios$/i })).toHaveAttribute(
      "href",
      "/devtools/repositories"
    );
  });
});
