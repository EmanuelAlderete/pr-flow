import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardRoutePage from "@/app/(shell)/dashboard/page";

vi.mock("@/modules/dashboard/components/dashboard-page", () => ({
  DashboardPage: () => <div data-testid="dashboard-page" />
}));

describe("DashboardRoutePage", () => {
  it("renders page header", () => {
    render(<DashboardRoutePage />);
    expect(screen.getByRole("heading", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });
});
