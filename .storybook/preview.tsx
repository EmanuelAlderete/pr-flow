import type { Preview } from "@storybook/nextjs-vite";
import { useLayoutEffect, type ReactNode } from "react";

import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";

import "../app/globals.css";

if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark", "font-sans");
}

function StorybookRoot({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("dark", "font-sans");
  }, []);

  return (
    <TooltipProvider delay={150}>
      {children}
      <Toaster theme="dark" />
    </TooltipProvider>
  );
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <StorybookRoot>
        <Story />
      </StorybookRoot>
    )
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      disable: true
    }
  }
};

export default preview;
