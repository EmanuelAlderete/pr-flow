import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue={["revisao"]} className="w-full max-w-md gap-2">
      <AccordionItem value="revisao">
        <AccordionTrigger>Revisão local</AccordionTrigger>
        <AccordionContent>A revisão roda uma pull request por vez, a cada 15 minutos.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="resumo">
        <AccordionTrigger>Resumo do dia</AccordionTrigger>
        <AccordionContent>O resumo é gerado à meia-noite e recupera os dias pendentes no boot.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
};
