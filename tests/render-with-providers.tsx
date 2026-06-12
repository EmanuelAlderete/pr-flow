import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";

function AppProviders({ children }: { children: ReactNode }) {
  return <WorkContextProvider>{children}</WorkContextProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult {
  return render(ui, { wrapper: AppProviders, ...options });
}
