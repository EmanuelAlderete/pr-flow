import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardVacationWidget } from "@/modules/vacation-countdown/components/dashboard-vacation-widget";
import {
  clearVacationCountdown,
  saveVacationCountdown
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";

describe("DashboardVacationWidget", () => {
  afterEach(() => {
    clearVacationCountdown();
  });

  it("shows empty state when no vacation date is configured", () => {
    render(<DashboardVacationWidget />);
    expect(screen.getByTestId("dashboard-vacation-widget")).toHaveTextContent(
      "Defina a data de início para ver a contagem regressiva."
    );
    expect(screen.getByRole("button", { name: /configurar/i })).toBeInTheDocument();
  });

  it("shows remaining days when a future date is stored", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    saveVacationCountdown({ startDate: `${y}-${m}-${d}`, promptDismissed: true });

    render(<DashboardVacationWidget />);
    expect(screen.getByTestId("dashboard-vacation-widget")).toHaveTextContent(
      "Faltam 7 dias para as férias."
    );
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
