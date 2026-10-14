import type { QuickNoteDateAnchors } from "@/modules/journal/lib/quick-note-date-anchors";
import { findQuickNoteActionCues } from "@/modules/journal/lib/quick-note-action-cues";

export function buildQuickNoteClassificationPrompt(
  text: string,
  anchors: QuickNoteDateAnchors
): string {
  const actionCues = findQuickNoteActionCues(text);
  const actionCueBlock =
    actionCues.length > 0
      ? `Sinais de ação já detectados no texto (obrigatório extrair pelo menos 1 tarefa; NÃO devolva tasks: []):
${actionCues.map((cue) => `- "${cue}"`).join("\n")}`
      : `Nenhum sinal automático de ação foi detectado. Ainda assim, se houver compromisso futuro implícito, extraia; senão tasks: [].`;

  return `Você extrai tarefas de uma captura rápida (quick note) de um desenvolvedor no PR Flow.

Texto do usuário:
"""
${text}
"""

${actionCueBlock}

Referência de calendário (hoje = ${anchors.today}; NÃO invente datas absolutas para frases relativas):
- today → ${anchors.today}
- tomorrow → ${anchors.tomorrow}
- end_of_work_week (sexta do período útil seg–sex) → ${anchors.endOfWorkWeek}
- next_monday → ${anchors.nextMonday}

Responda APENAS com um objeto JSON válido (sem markdown, sem texto extra), exatamente neste formato:
{"tasks":[{"title":string,"description":string|null,"dueDate":string|null,"dueRelative":"today"|"tomorrow"|"end_of_work_week"|"next_monday"|null}]}

Regras:
- A captura SEMPRE será salva no caderno; você só decide quais tarefas criar além disso.
- Notas narrativas/log frequentemente embutem compromissos. Varra o texto inteiro — especialmente o final — atrás de ações futuras, mesmo curtas.
- Gatilhos típicos (mesmo no meio de um parágrafo longo): "preciso", "ainda preciso", "tenho que", "falta", "amanhã vou/preciso", "lembrar de", "falar na daily", "falar com X", "avisar".
- Contexto passado ("hoje testei", "já avisei", "tive retorno") NÃO é tarefa. Compromisso futuro ("amanhã preciso falar…") É tarefa.
- tasks: lista de ações concretas. Pode ser vazia [] somente se não houver nenhum compromisso/ação futura.
- Uma frase pode gerar uma ou mais tarefas se houver destinatários/ações distintos (ex.: daily e uma pessoa → pode ser 1 tarefa combinada ou 2).
- title: curto, imperativo, em português do Brasil (máximo 200 caracteres). Inclua o assunto quando houver (ex.: falha do campo oab / JOR-311), não só "Falar na daily".
- description: detalhes úteis do contexto (opcional), ou null.
- Prazos relativos: use dueRelative e deixe dueDate null. Mapeamento obrigatório:
  - "hoje" → dueRelative "today"
  - "amanhã" → dueRelative "tomorrow"
  - "até o final dessa/da semana", "até sexta", "nessa semana", "esta semana" (prazo de conclusão) → dueRelative "end_of_work_week"
  - "próxima segunda", "na segunda" (futura) → dueRelative "next_monday"
- dueDate ("YYYY-MM-DD"): SOMENTE se o texto citar data absoluta explícita (ex.: "29/10", "2026-10-29"). Nunca invente dueDate para frase relativa.
- Sem prazo mencionado → dueDate null e dueRelative null.

Exemplo (narrativa + tarefa embutida):
Texto com log longo terminando em "amanhã ainda preciso falar isso na daily e com o Brunnelo."
→ {"tasks":[{"title":"Falar da falha do campo oab na daily e com o Brunnelo","description":"Integração GDC / JOR-311; payload sem oab no advogado das partes → cms-service no_op","dueDate":null,"dueRelative":"tomorrow"}]}`;
}
