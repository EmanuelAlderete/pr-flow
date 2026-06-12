# PR Flow — Design System

Especificação visual para manter consistência entre módulos (PRs, Tasks, Journal, Dashboard, Resumos).
**Implementação canônica dos tokens:** `app/globals.css` (bloco `.dark`). Este documento descreve intenção e uso; em caso de divergência, confiar no CSS e atualizar este arquivo.

## Direção

- **Produto:** cockpit local para dev — monitor de PRs + produtividade pessoal (tasks, journal, resumos IA).
- **Tom:** escuro, utilitário, “mission control”; profundidade com glass panels, não flat genérico.
- **Tema:** apenas **dark** (`<html class="dark">` em `app/layout.tsx`).
- **Idioma da UI:** **pt-BR** (labels, aria-labels, mensagens). Evitar misturar EN (“Open Tasks”, “Create”, etc.).

## Marca e acento

Cor de marca: **laranja ember** — quente, legível no navy, distinta de status semânticos das PRs.

| Token | Valor | Uso |
|-------|--------|-----|
| `--brand` | `#f07832` | CTAs, primário shadcn, barra ativa sidebar, spinners |
| `--brand-bright` | `#ff9a5c` | Hover, stats do hub, ícones de destaque |
| `--brand-dim` | `rgba(240, 120, 50, 0.14)` | Fundos sutis (item ativo, ícones hub) |
| `--brand-border` | `rgba(240, 120, 50, 0.42)` | Bordas de acento |
| `--brand-foreground` | `#1a0e06` | Texto sobre botão laranja sólido |
| `--app-link` | `#ffc18a` | Links em prose/markdown |
| `--app-accent` | `var(--brand-bright)` | Destaques de texto (stats, etc.) |

**Não usar laranja** para status de PR (approved / pending / changes) — esses têm paleta própria em `.pr-card`, `.status-pill`, barra lateral do card.

Alternativas consideradas (se mudar marca no futuro): âmbar (próximo demais do pending), ciano (frio demais), magenta (conflita com destructive).

## Superfície e texto (app)

| Token | Uso |
|-------|-----|
| `--app-bg-top` / `--app-bg-bottom` | Gradiente do `body` |
| `--app-glow` | Glow frio no topo; combinado com glow laranja leve no CSS |
| `--app-border` | Bordas de panels |
| `--app-border-strong` | Inputs, bordas internas |
| `--app-text` | Texto principal |
| `--app-text-muted` | Subtítulos, labels de seção |
| `--app-surface-inset` | Áreas recuadas (`.panel-inset`) |

## Tipografia

- **Fonte:** Geist via `next/font` → `--font-sans` (`app/layout.tsx`).
- **Não** reintroduzir Inter/Arial no `body`.
- Títulos de página: `PageHeader` (`text-2xl font-semibold`).
- Seções em cards PR: sentence case (`Quem já revisou`), **sem** ALL CAPS agressivo.

## Componentes

### `Surface` (`components/ui/surface.tsx`)

Wrapper padrão para blocos de conteúdo:

| Variant | Classe | Quando usar |
|---------|--------|-------------|
| `default` | `.panel` | Cards, colunas Tasks, editor Journal, resumo IA |
| `inset` | `.panel-inset` | Itens internos, textarea, listas |
| `dashed` | `.panel-dashed` | Empty states |

**Tasks / Journal / Dashboard / Resumos:** usar `Surface` + shadcn (`Button`, `Input`, `Dialog`).

**Módulo PRs:** mantém classes legadas `.panel`, `.pr-card`, `.button` em `globals.css` (já alinhadas aos tokens de marca).

### shadcn / Tailwind

**Agentes de IA:** leia [shadcn-for-agents.md](shadcn-for-agents.md) antes de criar botões, inputs, modais ou estilos novos.

- Botão primário: `Button` `variant="default"` → `--primary` (laranja).
- Outline/ghost para ações secundárias.
- Preferir `text-[var(--app-text)]`, `text-[var(--app-text-muted)]`, `text-[var(--brand)]` em layouts custom; `text-primary` onde shadcn já integra.

### Layout

- Conteúdo de rota: `app-shell` + `PageHeader` (`app/(shell)/*/page.tsx`).
- Hub inicial: `/dashboard` (`DashboardHub` + `DashboardBriefingWidget`).
- Shell: sidebar + header com “PR **Flow**” (`Flow` em `text-[var(--brand)]`).

## Cores semânticas (somente PRs)

Não reutilizar para marca global:

| Estado | Indicador |
|--------|-----------|
| Aprovada / pronta | Verde (`status-approved`, barra `#26c36f`) |
| Pendente, alterações, conflitos, sem reviewers | Vermelho (`status-changes`, barra `#d74a54`) |

## Motion

- Entrada da grid de PRs: `panel-in` em `.cards-grid > .panel` (stagger leve).
- Respeitar `prefers-reduced-motion` (já em weather rotator e grid).
- Microinterações pontuais (busca expansível, peek do card) — evitar animação excessiva em listas densas.

## Checklist para novas telas

1. Envolver seções em `Surface`, não `border border-border` cru.
2. Copy e `aria-label` em pt-BR.
3. Acento laranja só para **ação/marca**; status de domínio com tokens semânticos.
4. Reutilizar `PageHeader` na rota.
5. Após alterar tokens, sincronizar `app/globals.css` e este doc.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `app/globals.css` | Tokens, `.panel`, PR legacy, sidebar active |
| `app/layout.tsx` | Geist, `dark`, Toaster |
| `components/ui/surface.tsx` | Superfícies reutilizáveis |
| `components/layout/page-header.tsx` | Título + descrição de rota |
| `components/layout/app-sidebar.tsx` | Nav + clima + avatar |
| `modules/prs/**` | UI densa de PR (custom CSS) |
| `modules/{tasks,journal,dashboard,resumos}/**` | shadcn + Surface |

---

*Última revisão: 2026-05-29 — acento ember, sistema Surface unificado.*
