import { formatDailySummaryContextData } from "@/modules/notebook-day/lib/prompt";
import type { DailySummaryContext } from "@/modules/notebook-day/lib/types";

export function buildJournalDayDraftPrompt(context: DailySummaryContext): string {
  return `Você redige o rascunho da nota do caderno de um desenvolvedor, em português do Brasil, na primeira pessoa, como se a própria pessoa estivesse registrando o dia.

A nota não é um resumo gerencial nem um briefing. É um rascunho editável, só com estes três blocos e estes títulos:

## Feito
O que foi trabalhado neste dia: reviews, movimentação de tickets, tarefas em andamento, decisões. Bullets curtos. Apenas fatos presentes nos dados.

## Entregue
O que saiu de fato: tarefas concluídas, PRs mergeadas ou fechadas, tickets em status concluído. Se nada foi entregue, escreva exatamente: (nada entregue nos dados)

## Perguntas
De 3 a 5 perguntas que só a pessoa pode responder — bloqueio, decisão, o que ficou de fora dos sistemas, próximo passo, o que vale lembrar. Cada pergunta é um item de lista, seguido de uma linha em branco que começa com "> " para a resposta.

Exemplo:
- O que ainda impede o merge?
> 

Regras:
- Não invente fatos, nomes, tickets ou PRs.
- Reescreva os fatos em frases curtas de caderno. Não copie rótulos internos dos dados, como "merge/fechamento detectado" ou "status alterado neste dia".
- Se já houver anotação do dia, não a repita. Use-a só para não duplicar e para perguntar o que ficou de fora.
- Não dê coaching, motivação ou conselho de carreira.
- Não inclua preâmbulo nem texto fora das três seções.

${formatDailySummaryContextData(context)}
`;
}
