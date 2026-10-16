import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { StaleDataBanner } from "./stale-data-banner";

const savedAt = "2026-10-16T13:00:00.000Z";

const meta = {
  title: "Layout/StaleDataBanner",
  component: StaleDataBanner,
  args: {
    message: "A sincronização com o GitHub falhou."
  }
} satisfies Meta<typeof StaleDataBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSavedVersion: Story = {
  args: {
    fetchedAt: savedAt,
    message: "Exibindo os dados guardados até a próxima sincronização."
  }
};

export const WithRetry: Story = {
  args: {
    fetchedAt: savedAt,
    message: "Não foi possível buscar os tickets do Jira.",
    onRetry: fn(),
    retryLabel: "Atualizar agora"
  }
};

export const Retrying: Story = {
  args: {
    message: "A fila de revisão está desatualizada.",
    onRetry: fn(),
    isRetrying: true
  }
};
