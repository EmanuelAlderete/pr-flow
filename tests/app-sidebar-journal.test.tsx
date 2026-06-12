import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/journal"
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

describe("AppSidebar Journal navigation", () => {
  it("shows Journal navigation entry linking to /journal", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    const link = screen.getByRole("link", { name: /^journal$/i });
    expect(link).toHaveAttribute("href", "/journal");
  });
});
