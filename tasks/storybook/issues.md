# Fatias — Storybook

Cada fatia é verificável sozinha. A fatia 1 bloqueia as demais. As fatias 2–8 só criam `*.stories.tsx` e não editam `.storybook/`, `package.json` nem componentes de produção.

Contrato comum (fatias 2–8):

- Ler `tasks/storybook/TASK.md`.
- Uma story file por componente, ao lado do fonte.
- Estado `Default` obrigatório. Acrescentar stories nomeadas só quando o componente já expõe variante, vazio, erro, loading ou dialog aberto.
- Fixture pt-BR. Sem rede, sem banco, sem `.env`.
- `fetch` mockado no `beforeEach` quando o componente busca dados; restaurar no cleanup.
- Não editar `.storybook/**`, `package.json`, `package-lock.json` nem o componente de produção.
- Se faltar decorator compartilhado, usar decorator só naquela story.

## 1. Scaffold

- Tipo: AFK
- Bloqueada por: nenhuma
- Entrega: Storybook instalado, preview dark com `globals.css` + `TooltipProvider` + `Toaster`, scripts npm, `storybook-static/` no gitignore, e `components/ui/button.stories.tsx` com as variants do Button. `build-storybook` passa.

## 2. Catálogo shadcn

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `components/ui/*` exceto `button.tsx` (já tem story na fatia 1). Inclui accordion, alert-dialog, calendar, checkbox, context-menu, date-picker, dialog, help-hint, input, popover, select, separator, sheet, sidebar, skeleton, sonner, surface, textarea, tooltip.

## 3. Shell

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `components/layout/page-header.tsx`, `components/layout/app-sidebar.tsx`, `components/stale-data-banner.tsx`, `components/quick-note/quick-note-dialog.tsx`.

## 4. PRs — peças do card

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `impediment-icon`, `pr-local-review-icon`, `pr-alert-icons`, `search-icon`, `sync-icon`, `weather-condition-icon`, `weather-forecast`, `pr-open-duration`, `reviewer-list-item`, `pr-card-slack-icon`, `pr-card-slack-shared-badge`, `pr-search-bar`, `pr-card`, `pr-card-context-menu`, `pr-insights-panel` em `modules/prs/components/`.

## 5. PRs — páginas, diálogos e revisão local

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `pr-monitor-page`, `pr-reviewer-queue-page`, `pr-reviewer-queue-item`, `open-pr-wizard`, `pr-slack-share-dialog`, `pr-slack-reshare-dialog`, `pr-jira-task-dialog`, `pr-local-review-usage`, `pr-local-review-start-dialog`, `pr-local-review-trigger`, `pr-local-review-page`, `pr-local-review-board`, `pr-local-review-block`.

## 6. Dashboard e widgets

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `modules/dashboard/components/*`, `modules/day-calendar/components/*`, `modules/vacation-countdown/components/*`, `modules/journal/components/dashboard-journal-streak-widget.tsx`, `modules/shortcut-deck/components/*` e o componente de ícone exportado em `modules/shortcut-deck/lib/shortcut-deck-icons.tsx`.

## 7. Journal, tasks, resumos, notificações

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `modules/journal/components/journal-page.tsx`, `modules/journal/components/notebook-day-picker.tsx`, `modules/tasks/components/tasks-page.tsx`, `modules/summaries/components/*`, `modules/notifications/components/*`.

## 8. Jira, contexto de trabalho e devtools

- Tipo: AFK
- Bloqueada por: 1
- Arquivos: `modules/jira/components/*`, `modules/jira-branch/components/*`, `modules/work-context/components/*`, `modules/devtools/components/*`, `modules/local-docker/components/local-docker-page.tsx`.
