import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { describeWeatherCode, type WeatherIconKind } from "@/modules/prs/lib/core/open-meteo-weather";

import { WeatherConditionIcon } from "./weather-condition-icon";

const conditions: Array<{ kind: WeatherIconKind; weatherCode: number }> = [
  { kind: "clear", weatherCode: 0 },
  { kind: "partly-cloudy", weatherCode: 2 },
  { kind: "cloudy", weatherCode: 3 },
  { kind: "fog", weatherCode: 45 },
  { kind: "rain", weatherCode: 61 },
  { kind: "snow", weatherCode: 71 },
  { kind: "storm", weatherCode: 95 }
];

const meta = {
  title: "PRs/WeatherConditionIcon",
  component: WeatherConditionIcon,
  args: {
    weatherCode: 0,
    className: "size-8"
  }
} satisfies Meta<typeof WeatherConditionIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllKinds: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-[var(--app-text)]">
      {conditions.map((item) => (
        <div key={item.kind} className="flex w-32 flex-col items-center gap-2 text-center">
          <WeatherConditionIcon weatherCode={item.weatherCode} className="size-8" />
          <span className="text-xs text-[var(--app-text-muted)]">{describeWeatherCode(item.weatherCode)}</span>
        </div>
      ))}
    </div>
  )
};
