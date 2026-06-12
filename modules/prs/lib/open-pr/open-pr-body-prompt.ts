export type OpenPrBodyPromptInput = {
  repository: string;
  branch: string;
  baseBranch: string;
  title: string;
  template: string;
  changeSummary: string;
};

export function buildOpenPrBodyPrompt(input: OpenPrBodyPromptInput): string {
  const templateSection =
    input.template.trim().length > 0
      ? input.template.trim()
      : "(repositório sem .github/pull_request_template.md — use estrutura clara em Markdown com seções objetivas)";

  return `Você preenche a descrição de uma Pull Request no GitHub.

Contexto (não reproduza no resultado):
- Repositório: ${input.repository}
- Branch: ${input.branch} → base: ${input.baseBranch}
- Título: ${input.title}

## Template do repositório (siga à risca)
Reproduza exatamente os títulos, a ordem e a estrutura deste template. Preencha cada seção com texto curto em pt-BR.

${templateSection}

## Resumo das alterações (apenas para sua análise — NÃO inclua no resultado)
Use o resumo abaixo somente para entender o impacto das mudanças.
Nunca reproduza este bloco, nem sintaxe de diff/patch, nem listagens cruas de arquivos com \`+\`/\`-\`.

${input.changeSummary}

## Regras de saída
1. Responda APENAS com o corpo final em Markdown, pronto para colar no GitHub — sem prefácio, sem comentários, sem blocos de diff.
2. Preencha somente as seções do template. Não adicione seções extras.
3. Seja objetivo: bullets ou parágrafos curtos por seção. Resuma o impacto em linguagem natural.
4. No primeiro título (\`#\`), use exatamente o formato do template: \`# [mesmo texto do título da PR](jira_link)\` — o placeholder \`jira_link\` será substituído depois; não deixe só texto plano no H1 quando o título contém JOR-xxx.
5. Não invente outros links, tickets extras, passos de teste, riscos ou comportamentos que não estejam evidenciados no resumo ou no título.
6. Se uma seção do template não puder ser respondida com o que o resumo mostra, escreva apenas "N/A" ou "Não se aplica" — sem especular.
7. Não mencione que usou IA, diff ou template.`;
}

export function buildOpenPrBodyRetryPrompt(input: OpenPrBodyPromptInput): string {
  return `${buildOpenPrBodyPrompt(input)}

## Correção obrigatória
Sua resposta anterior foi rejeitada por conter diff/patch bruto.
Responda novamente somente com Markdown da descrição da PR, seguindo o template.
É proibido incluir \`diff --git\`, linhas com \`+\`/\`-\` de patch, blocos de código com patch ou listagens cruas de arquivos alterados.`;
}
