import type { JiraBranchNamingContext } from "@/modules/jira-branch/lib/jira-branch-context";

export function buildJiraBranchSlugPrompt(context: JiraBranchNamingContext): string {
  const descriptionSection = context.description?.trim()
    ? context.description.trim()
    : "(sem descrição)";

  const commentsSection =
    context.comments.length > 0
      ? context.comments.map((body, index) => `### Comentário ${index + 1}\n${body}`).join("\n\n")
      : "(sem comentários recentes)";

  return `Você sugere o slug (último segmento) de uma branch Git para um ticket Jira.

Ticket: ${context.issueKey}
Tipo: ${context.issueTypeName}
Título: ${context.summary}

## Descrição
${descriptionSection}

## Comentários recentes
${commentsSection}

## Regras de saída
1. Responda APENAS com o slug em inglês, kebab-case (ex.: add-login-endpoint).
2. Sem prefixo feat/, fix/ ou key JOR-xxx — somente o slug.
3. Máximo ${50} caracteres.
4. Sem espaços, sem acentos, sem barras, sem aspas.
5. Descreva a intenção do trabalho, não copie o título integral se ele for vago.
6. Não inclua prefácio, markdown ou explicações.`;
}
