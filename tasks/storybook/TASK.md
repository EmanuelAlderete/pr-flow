# Storybook do PR Flow

Catálogo visual de todos os componentes React do app, no tema dark real (laranja ember, tokens de `app/globals.css`), para revisar UI sem subir o servidor Next nem bater em GitHub, Jira, Gemini ou SQLite.

## Problema

O PR Flow tem dezenas de componentes (shadcn, shell, PRs, dashboard, journal, tasks, resumos, Jira, devtools) e nenhum lugar para vê-los isolados. Mudança visual só aparece dentro da rota, com dados ao vivo.

## Solução

Storybook no próprio repo, dark-only, com uma story por componente exportado em `components/` e `modules/**/components/`. Cada story mostra o estado padrão e, quando o componente tem variantes ou estados visíveis (vazio, erro, loading, aberto), esses estados também.

## Decisões

- Framework: Storybook estável atual com builder Next (preferir `@storybook/nextjs-vite` se o init oficial oferecer). React 19, Next 16, Tailwind v4 via `postcss.config.mjs` (`@tailwindcss/postcss`) e `app/globals.css`.
- Porta `6006`. App de dev continua em `3847`.
- Scripts: `storybook` e `build-storybook`.
- Preview importa `app/globals.css`, força `class="dark"` no root, envolve com `TooltipProvider` e `Toaster` (theme dark), como `app/layout.tsx`. Fonte: a variável `--font-sans` já usada pelo app; se `next/font` não carregar no Storybook, usar a fallback do CSS sem alterar o layout de produção.
- Stories colocadas ao lado do componente: `Nome.stories.tsx`. Título CSF: área + nome (`UI/Button`, `PRs/PrCard`, `Dashboard/DashboardHub`, `Journal/JournalPage`, `Tasks/TasksPage`, `Summaries/SummariesPage`, `Jira/JiraPage`, `Devtools/CronsPage`).
- Copy de fixture em pt-BR. Identificadores e títulos de story em inglês.
- Não alterar comportamento, props ou markup de produção para “facilitar” a story. Fixture, decorator local ou mock de `fetch` resolvem.
- Dados: interceptar `fetch` no `beforeEach` da story (e restaurar no cleanup). Não chamar APIs reais. Não abrir SQLite. Não ler `.env`.
- `next/link` e `next/navigation` ficam a cargo do framework Storybook para Next. Não mockar à mão se o framework já faz isso.
- Vitest ignora `*.stories.tsx` (padrão atual só pega `*.test`/`*.spec`). Não adicionar addon de teste nesta entrega.
- `storybook-static/` no `.gitignore`.
- Não commitar.

## Fora de escopo

- Publicar Storybook (Chromatic, CI, deploy).
- Testes de interação com addon Vitest/Playwright.
- Redesign ou migração do CSS legado de PR (`.pr-card`, `.button`).
- Documentar funções que não são componentes React.
- Light mode.

## Pronto quando

- `npm run storybook` sobe e o Button shadcn aparece com tokens ember no dark.
- `npm run build-storybook` termina sem erro.
- Todo arquivo de componente em `components/` e `modules/**/components/` tem `*.stories.tsx` cobrindo o export principal.
- `npm test` continua passando.
