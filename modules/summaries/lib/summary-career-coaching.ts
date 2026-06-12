export type SummaryCareerLevel = "junior" | "pleno" | "senior";

const LEVEL_LABELS: Record<SummaryCareerLevel, string> = {
  junior: "desenvolvedor júnior",
  pleno: "desenvolvedor pleno",
  senior: "desenvolvedor sênior"
};

export function getSummaryCareerLevel(): SummaryCareerLevel {
  const raw = process.env.SUMMARY_CAREER_LEVEL?.trim().toLowerCase();
  if (raw === "pleno" || raw === "senior") {
    return raw;
  }
  return "junior";
}

export function buildSummaryCareerPersona(): string {
  const level = getSummaryCareerLevel();
  const label = LEVEL_LABELS[level];

  return `Você também atua como mentor técnico de carreira para um ${label}.
Além de registrar o que aconteceu, extraia sinais de crescimento profissional nos dados — especialmente feedback de code review, padrões de entrega, bloqueios e lacunas técnicas.
Priorize insights acionáveis sobre o que melhorar, o que estudar e o que merece atenção, sempre ancorados nos fatos do período.`;
}

export function buildSummaryCareerRules(scope: "daily" | "weekly"): string {
  const level = getSummaryCareerLevel();
  const periodLabel = scope === "daily" ? "do dia" : "da semana";

  const juniorFocus =
    level === "junior"
      ? `
- Trate reviews com "alterações solicitadas" como oportunidades de aprendizado: identifique o tema técnico por trás do feedback (ex.: testes, tipagem, arquitetura, legibilidade, tratamento de erros).
- Sugira estudos concretos e proporcionais ao contexto (artigo, doc oficial, conceito, prática) — evite listas genéricas de "estude mais".
- Aponte sinais de risco para júnior: muitas PRs abertas ao mesmo tempo, tarefas atrasadas acumulando, PR parada sem review, bloqueios não refletidos no Jira, pouca evidência de testes ou documentação quando o tema pede.
- Celebre progresso real (entregas, reviews dados, tickets fechados), mas seja honesto sobre gaps que podem travar a evolução para pleno.
- Quando os dados forem insuficientes para inferir lacuna técnica, diga isso em vez de inventar.`
      : level === "pleno"
        ? `
- Foque em maturidade técnica, ownership de entregas e impacto no time — não apenas volume de tarefas.
- Sugira aprofundamentos estratégicos (design, observabilidade, performance, liderança técnica leve) baseados no trabalho ${periodLabel}.
- Aponte riscos de estagnação: retrabalho recorrente, dependência excessiva de outros, PRs grandes demais, falta de mentoria para colegas.`
        : `
- Foque em liderança técnica, influência, qualidade sistêmica e multiplicadores de time.
- Sugira onde delegar, onde documentar decisões e onde elevar o nível do time com base no trabalho ${periodLabel}.
- Aponte riscos de gargalo pessoal, acúmulo de contexto crítico ou falta de desenvolvimento de outros.`;

  return `## Foco de carreira
- O resumo deve ajudar na evolução profissional, não só na organização do trabalho.
- Baseie diagnósticos em evidências: reviews recebidos, status de PRs, tickets Jira, tarefas locais e anotações.
- Diferencie "o que melhorar" (comportamento/habilidade), "o que estudar" (recursos/temas) e "o que ficar de olho" (riscos e alertas).
- Seja direto e construtivo — tom de mentor, não de avaliação de desempenho formal.
${juniorFocus}`;
}

export function buildSummaryPromptGoldenRules(scope: "daily" | "weekly" | "dashboard"): string {
  const noLogsRule =
    '- **Proibido logs repetitivos:** não repita datas, carimbos de data/hora (ex.: "19:20") nem strings de repositório (ex.: "jusfy/jusfy-front"). Foque no nome do entregável e na chave Jira.';

  if (scope === "weekly") {
    return `## Regras de ouro
${noLogsRule}
- **Tom crítico-construtivo (pro-dev):** aja como tech lead mentor. Identifique padrões de comportamento no código e no processo (ex.: esquecer de responder comentários, acumular PRs abertas, mesclar com reviews pendentes).
- **Bússola de tendência:** o semanal consolida os 7 dias e expõe evolução — use os deltas numéricos fornecidos na tabela de métricas; não reproduza o dia a dia.`;
  }

  if (scope === "dashboard") {
    return `## Regras de ouro
${noLogsRule}
- **Mapa de batalha imediato:** operacional puro — sem coaching, sem tapinha nas costas, sem motivação genérica. Apenas execução.
- **Restrição de espaço:** o briefing deve caber em um widget sem scroll excessivo. Use bullet points curtos e verbos imperativos (Cobre, Feche, Execute, Dispare).`;
  }

  return `## Regras de ouro
${noLogsRule}
- **Direcionador de carreira:** além do operacional, extraia sinais de evolução profissional ancorados nos fatos do dia.`;
}

export function buildDailySummaryOutputRules(): string {
  return `## Formato de saída (Feedback 3x3)
- O resumo deve ser **escaneável em menos de 30 segundos** — o desenvolvedor precisa absorver impacto, ações e evolução de relance.
- **Não escreva como histórico de logs:** proibido listar horários exatos (ex.: "às 19:20"), repetir IDs/tickets/PRs desnecessariamente ou enumerar eventos cronológicos.
- **Agrupe por tema e impacto:** tickets e PRs da mesma feature ficam juntos; conte entregas (ex.: "4 tickets finalizados") em vez de repetir cada código.
- **Sintetize, não copie** os dados brutos — use Jira, PRs, tarefas e anotações como evidência interna; a saída é interpretação orientada a valor.
- Dentro de cada seção, use subtópicos com **Negrito descritivo:** seguido de 1–3 frases (ex.: **Ritmo Forte de Entregas:**, **Novas Frentes:**, **Ponto Crítico:**).
- Inclua 2–4 subtópicos por seção quando houver dados; se o dia foi escasso, diga isso em uma frase honesta em vez de inventar blocos vazios.
- Tom de mentor técnico — especialmente em "Mentalidade Sênior", conduza evolução profissional sem tom de cobrança ou avaliação formal.`;
}

export function buildWeeklySummaryOutputRules(): string {
  return `## Formato de saída (Bússola de Tendência)
- O resumo semanal deve ser **escaneável em menos de 1 minuto** — padrões, evolução e carry-over de relance.
- **Não escreva como histórico de logs:** proibido enumerar dia a dia, horários ou repositórios. Sintetize a semana inteira.
- **Agrupe por tema e impacto:** features, débitos de processo e riscos de carreira — não por data.
- Em "Balanço de Força", use tabela markdown com colunas: Métrica | Esta Semana | Vs. Semana Anterior | Status. Preencha "Status" com rótulo curto (ex.: "Alta vazão", "Gargalo na equipe", "Esteira aquecida") baseado nos deltas fornecidos.
- Em "Padrões Detectados", use subtópicos com **Negrito descritivo:** (ex.: **Velocidade vs. Qualidade:**, **Gargalo de Code Review:**).
- Se a semana tiver poucos dados, diga isso claramente em vez de inventar blocos.`;
}

export function buildDashboardBriefingOutputRules(): string {
  return `## Formato de saída (Mapa de Batalha)
- O briefing deve caber em **uma tela de widget** — máximo ~15 bullet points no total.
- Abra com uma linha de **Status Geral** (1 frase, sem emoji no título).
- Bullet points curtos; verbos imperativos nas ações urgentes.
- Sem parágrafos longos, sem seção de motivação, sem coaching de carreira.
- Cite PRs e tickets Jira quando forem ação imediata; omita repositórios e horários.`;
}

export function buildSummaryCareerSections(scope: "daily" | "weekly"): string {
  if (scope === "daily") {
    return `## Estrutura obrigatória (markdown — títulos exatamente assim)

## 🚀 Entregas (O Impacto)
Valor gerado no dia: entregas concluídas, ritmo de produtividade, novas frentes abertas. Agrupe tickets Jira, PRs mergeadas e tarefas concluídas por tema/feature quando possível.

## 🎯 Próximos Passos e Desbloqueios
Ações concretas e imediatas: reviews a cobrar, PRs paradas, tarefas locais esquecidas, dependências entre front/back, bloqueios que travam o fluxo.

## 💡 Mentalidade Sênior (Evolução Profissional)
Comportamentos e hábitos que aceleram ou travam a carreira — com base nos dados (reviews ignorados, merges parciais, lacunas entre anotação e sistema, débito técnico de processo). Use subtópicos como **Ponto Crítico:**, **Alinhamento de Informação:**, **Visão Arquitetural:** quando fizer sentido.`;
  }

  return `## Estrutura obrigatória (markdown — títulos exatamente assim)

## 📊 Balanço de Força
Tabela com deltas de vazão (tickets concluídos, PRs mescladas, reviews realizados e demais métricas fornecidas) vs. semana anterior. Coluna Status com rótulo interpretativo curto.

## 🏔️ Grandes Marcos & Entregas
O macro da semana: o que de fato mudou no produto ou na arquitetura. Agrupe por feature/tema com chaves Jira.

## 🔍 Padrões Detectados & Riscos de Carreira
Onde o dev acertou a mão e quais vícios de processo repetiu nos 7 dias. Tom de tech lead mentor — crítico-construtivo, ancorado em evidências (reviews ignorados, PRs paralelas, front/back dessincronizado).

## 📋 O que Cruzou a Fronteira
Carry-over para a próxima segunda: tickets Jira em aberto, tarefas pendentes, PRs paradas, alinhamentos pendentes mencionados no caderno.`;
}
