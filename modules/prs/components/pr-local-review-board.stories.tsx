import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { buildLocalReviewView } from "@/modules/prs/lib/local-review/local-review-markdown";

import { PrLocalReviewBoard } from "./pr-local-review-board";

const headSha = "b2c3d4e5f6789012345678901234567890abcdef";
const repository = "jusfy/api";

const view = buildLocalReviewView(
  {
    summary: "Há um null esquecido no retry da fila. O restante só renomeia variável local.",
    docsLoaded: ["docs/design-system.md", "CONTEXT.md"],
    findings: [
      {
        agent: "correctness",
        path: "modules/prs/components/pr-reviewer-queue-page.tsx",
        line: 42,
        message: "O filtro ignora PRs dispensadas quando a fila recarrega.",
        confidence: 0.91
      },
      {
        agent: "contracts",
        path: "modules/prs/lib/domain.ts",
        line: 99,
        message: "O contrato da fila não descreve o banner de revisão em andamento.",
        confidence: 0.88
      }
    ],
    notCommented: ["modules/prs/components/pr-search-bar.tsx — sem mudança de comportamento"],
    cleanJustification: "O restante só renomeia variável local e não altera o fluxo.",
    traceability: [
      {
        item: "A fila destaca a revisão local em andamento.",
        status: "met"
      }
    ],
    metaReview: {
      dropped: [],
      notes: "Nenhum achado foi descartado. Os dois apontamentos permanecem."
    }
  },
  { repository, headSha }
);

const meta = {
  title: "PRs/PrLocalReviewBoard",
  component: PrLocalReviewBoard,
  args: {
    view
  }
} satisfies Meta<typeof PrLocalReviewBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
