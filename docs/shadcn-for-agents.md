# shadcn/ui — guia para agentes de IA

Documento de **prioridade alta** para qualquer agente que altere UI neste repositório. Complementa [design-system.md](design-system.md) e [AGENTS.md](../AGENTS.md).

## Regra principal

**Prefira sempre componentes shadcn** (`@/components/ui/*`) em vez de HTML cru com classes inventadas (`<button className="...">`, `<input>`, modais manuais, etc.).

Só fuja do shadcn quando:

1. O módulo **PRs** usar classes legadas documentadas (`.pr-card`, `.button` em `globals.css`) — e mesmo assim, **Tooltip**, **Sonner** e ações pontuais já usam shadcn.
2. Não existir componente adequado → **adicione** via CLI (ver abaixo), não reimplemente.
3. O pedido for explicitamente manter o visual legado de PR sem migração.

## Por que

- Tokens (`--primary`, `--border`, etc.) já mapeiam para a marca laranja em `app/globals.css`.
- Acessibilidade (focus, `aria`, Radix) vem pronta.
- Menos CSS ad hoc e menos divergência entre Tasks, Journal, Dashboard, Jira e Resumos.

## Configuração do projeto

| Item | Valor |
|------|--------|
| Config | `components.json` (style `base-nova`, `cssVariables: true`) |
| Aliases | `@/components/ui`, `@/lib/utils` |
| Ícones | `lucide-react` |
| Tema | `dark` fixo em `app/layout.tsx` |

Instalar componente novo (agente com shell):

```bash
npx shadcn@latest add <nome> --yes
```

Exemplos úteis ainda não no repo: `dropdown-menu`, `tabs`, `badge`, `checkbox`, `textarea`, `switch`. Ver [ui.shadcn.com](https://ui.shadcn.com/docs/components).

## Componentes já disponíveis

Use estes antes de criar equivalentes custom:

| Componente | Caminho | Uso típico no PR Flow |
|------------|---------|------------------------|
| `Button` | `components/ui/button.tsx` | CTAs, ícones (`size="icon"`), `variant="outline"` / `ghost` / `secondary` |
| `Input` | `components/ui/input.tsx` | Formulários Tasks, buscas |
| `Dialog` | `components/ui/dialog.tsx` | Edição/criação (Tasks) |
| `AlertDialog` | `components/ui/alert-dialog.tsx` | Confirmação destrutiva |
| `Select` | `components/ui/select.tsx` | Filtros (Jira) |
| `Popover` + `Calendar` | `popover.tsx`, `calendar.tsx` | Seletor de dia (Journal) |
| `DatePicker` | `components/ui/date-picker.tsx` | Data com locale pt-BR (Tasks) |
| `Tooltip` | `components/ui/tooltip.tsx` | Ícones no card de PR, ações compactas |
| `HelpHint` | `components/ui/help-hint.tsx` | Texto explicativo sob título → ícone `CircleHelp` + tooltip (hover/foco); empty/status ficam visíveis |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading de listas |
| `Sidebar` | `components/ui/sidebar.tsx` | Shell (`app-sidebar`) |
| `Sheet` | `components/ui/sheet.tsx` | Painéis laterais (se necessário) |
| `Separator` | `components/ui/separator.tsx` | Divisores em layout |
| `Surface` | `components/ui/surface.tsx` | **Wrapper** de seção (`.panel` / inset / dashed) — não substitui Button/Input |
| `Toaster` / Sonner | `components/ui/sonner.tsx` | Feedback (`toast.success`, etc.) |

## Padrão de composição

### Nova tela ou seção (fora do módulo PRs)

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/layout/page-header";

export function MinhaPage() {
  return (
    <div className="app-shell">
      <PageHeader title="Título" description="Explicação breve — vira HelpHint ao lado do título." />
      <Surface className="p-4">
        <form className="flex gap-2">
          <Input placeholder="Exemplo" aria-label="Campo exemplo" />
          <Button type="submit">Salvar</Button>
        </form>
      </Surface>
    </div>
  );
}
```

### Referências no código

| Módulo | Arquivo de referência |
|--------|----------------------|
| Tasks | `modules/tasks/components/tasks-page.tsx` |
| Journal | `modules/journal/components/journal-page.tsx` |
| Dashboard | `modules/dashboard/components/dashboard-briefing-widget.tsx` |
| Jira | `modules/jira/components/jira-page.tsx` |
| Resumos | `modules/summaries/components/summaries-page.tsx` |
| Shell | `components/layout/app-sidebar.tsx` |

## Mapeamento rápido (intenção → shadcn)

| Preciso de… | Use |
|-------------|-----|
| Botão / link de ação | `Button` (`asChild` + `<a>` se for link externo estilizado) |
| Campo de texto | `Input` (ou `Textarea` após `shadcn add textarea`) |
| Modal de formulário | `Dialog` |
| “Tem certeza?” | `AlertDialog` |
| Lista suspensa | `Select` |
| Data | `DatePicker` ou `Popover` + `Calendar` |
| Dica em ícone | `Tooltip` |
| Estado de carregamento | `Skeleton` |
| Toast | `sonner` (`import { toast } from "sonner"`) |
| Card / bloco de conteúdo | `Surface` + filhos shadcn |
| Menu de navegação lateral | `Sidebar` (já no layout) |

## Variantes e tokens

- **Primário (laranja):** `Button` default → `--primary` / `--brand`.
- **Secundário:** `variant="outline"` ou `variant="secondary"`.
- **Destrutivo:** `variant="destructive"` em ações irreversíveis.
- **Texto:** `text-[var(--app-text)]`, `text-[var(--app-text-muted)]`, `text-[var(--brand)]` quando o layout não passar por variante shadcn.
- **Não** usar `text-primary` para status de PR (verde/vermelho) — ver design-system.

Estender aparência: `className={cn("...", className)}` com `cn` de `@/lib/utils`, sem sobrescrever comportamento Radix.

## pt-BR e acessibilidade

- Labels visíveis e `aria-label` em português (padrão do produto).
- Botões só com ícone: `size="icon"` + `aria-label` descritivo.
- Mensagens de toast e diálogos em pt-BR.
- Ao mudar copy de botões/`aria-label`, atualizar testes em `tests/`.

## Anti-padrões (evitar)

| Evitar | Fazer |
|--------|--------|
| `<button className="button">` em Tasks/Journal/Dashboard/Jira/Resumos | `Button` shadcn |
| Modal com `position: fixed` + div custom | `Dialog` / `AlertDialog` |
| `<select>` nativo estilizado à mão | `Select` |
| Novo arquivo `components/foo-button.tsx` duplicando shadcn | `Button` + `className` |
| Instalar outra lib de UI (MUI, Chakra, etc.) | shadcn + Radix |
| `alert()` / `confirm()` do browser | `AlertDialog` ou `toast` |

## Módulo PRs (exceção parcial)

- Cards e barra de status: CSS legado `.pr-card`, `.status-pill` em `app/globals.css` (cores **verde/vermelho**, não laranja de marca).
- Botão de sync na toolbar: `.button.icon-button` legado — aceitável até migração explícita.
- **Já migrado para shadcn:** `Tooltip` nos ícones de alerta e ações do peek do card.

Ao **estender** o monitor de PRs, preferir shadcn para elementos novos (filtros, dialogs, selects) e só manter legado onde o layout denso do card exigir.

## Checklist antes de abrir PR / entregar diff

1. [ ] UI nova usa `@/components/ui/*`?
2. [ ] Seções envolvidas em `Surface` (fora de `.pr-card`)?
3. [ ] Componente faltando foi adicionado com `npx shadcn@latest add` (e commitado em `components/ui/`)?
4. [ ] Sem biblioteca de UI paralela?
5. [ ] Copy e `aria-label` em pt-BR?
6. [ ] `npm test` passa se labels mudaram?

## Relacionados

- [design-system.md](design-system.md) — tokens, `Surface`, cores de status PR
- [zod-validation.md](zod-validation.md) — validação de formulários e APIs no server (Zod)
- [AGENTS.md](../AGENTS.md) — stack, rotas, comandos

---

*Última revisão: 2026-05-29 — política “shadcn first” para agentes.*
