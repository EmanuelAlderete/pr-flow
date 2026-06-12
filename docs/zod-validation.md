# Zod — validação no PR Flow

Documento de **prioridade alta** para agentes e contribuidores que toquem em **dados não confiáveis**: APIs, query strings, JSON de terceiros, cache no browser, variáveis de ambiente e payloads de formulário.

Complementa [AGENTS.md](../AGENTS.md). Para UI, ver [shadcn-for-agents.md](shadcn-for-agents.md).

## Regra principal

**Sempre que possível, validar com [Zod](https://zod.dev/)** em vez de `if`/`typeof` manuais, casts (`as Foo`) ou tipos TypeScript que só existem em compile time.

O projeto já declara `zod` em `package.json` (^4.x). Não adicione outra biblioteca de validação (Yup, Joi, etc.) sem alinhamento explícito.

## Quando usar Zod

| Situação | Exemplos no repo |
|----------|------------------|
| Query / route params | `?type=daily`, `?limit=50`, `?sprint=active` |
| Body JSON em `app/api/**` | criar tarefa, salvar nota, preferências |
| Respostas de APIs externas | GitHub (`gh`), Jira, Gemini |
| Leitura de `sessionStorage` / cache cliente | `dashboard-widget-cache.ts` |
| Variáveis de ambiente críticas | tokens, URLs, listas (`MONITORED_REPOSITORIES`) |
| Server Actions e formulários | campos obrigatórios, enums, datas `YYYY-MM-DD` |

## Quando Zod é opcional

- Tipos já garantidos pelo **Drizzle** (`$inferSelect` / `$inferInsert`) **depois** de ler do Postgres — o banco é a fonte; Zod entra na **entrada** da API, não em cada linha retornada.
- Constantes internas e enums fechados no próprio módulo (sem input externo).
- Guards triviais de uma linha em código que **nunca** recebe input do usuário ou da rede.

Na dúvida, use Zod — o custo é baixo e evita regressões silenciosas.

## Organização de arquivos

Evite misturar com schemas **Drizzle** (tabelas Postgres):

| Finalidade | Nome usual | Exemplo |
|----------|------------|---------|
| Tabelas Drizzle | `schema.ts` | `modules/tasks/lib/schema.ts` |
| Schemas Zod (runtime) | `validation.ts` ou `<recurso>-validation.ts` | `modules/summaries/lib/summaries-query-validation.ts` |

Coloque schemas Zod no **módulo de domínio** (`modules/<nome>/lib/`), não espalhados em rotas `app/api/`. A rota importa o schema e trata o resultado.

Helpers HTTP compartilhados (se surgirem): `lib/validation/` — ex. formatar `ZodError` → resposta 400 em pt-BR.

## Padrões recomendados

### 1. Schema + tipo inferido

```ts
import { z } from "zod";

export const resumosListQuerySchema = z.object({
  type: z.enum(["daily", "weekly"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export type ResumosListQuery = z.infer<typeof resumosListQuerySchema>;
```

Prefira `z.infer<typeof schema>` a duplicar interfaces à mão.

### 2. `safeParse` nas bordas (rotas, fetch)

```ts
const parsed = resumosListQuerySchema.safeParse({
  type: searchParams.get("type") ?? undefined,
  limit: searchParams.get("limit") ?? undefined
});

if (!parsed.success) {
  return NextResponse.json(
    { message: "Parâmetros inválidos.", issues: parsed.error.flatten() },
    { status: 400 }
  );
}

const { type, limit } = parsed.data;
```

Use `.parse()` só quando falha deve estourar exceção (scripts internos, testes).

### 3. Objetos externos: `.strict()` quando fizer sentido

Respostas de terceiros não devem passar campos extras sem revisão:

```ts
export const jiraIssueSchema = z
  .object({
    key: z.string(),
    fields: z.object({ summary: z.string() })
  })
  .strict();
```

### 4. Mensagens em pt-BR

`z.string({ error: "Título é obrigatório" })` ou `.min(1, "Título é obrigatório")` — alinhado à UI do produto.

### 5. Datas e enums do domínio

- Dia de calendário: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` ou helper compartilhado com `notebook-day`.
- Enums de negócio: `z.enum([...])` espelhando o que a API expõe (não só o enum do Drizzle).

### 6. Números em query string

Use `z.coerce.number()` — query params chegam como string.

## Respostas HTTP

| Resultado | Status | Corpo (sugestão) |
|-----------|--------|------------------|
| Validação falhou | `400` | `{ message: "…", issues?: … }` |
| Auth / config | `401` / `503` | conforme módulo |
| Erro inesperado | `500` | mensagem genérica; log com `details` |

Não vaze stack trace na resposta JSON.

## Testes

- Teste schemas Zod **isolados** em `tests/` com casos válidos e inválidos (barato, sem HTTP).
- Ao migrar um `parseFoo` manual para Zod, mantenha ou adapte os testes existentes da rota.

## Migração incremental

Código legado com parsers manuais (ex.: `parseSummaryType`, `parseLogLevelParam`) pode permanecer até ser tocado; **ao alterar o arquivo**, prefira extrair um schema Zod no mesmo PR.

Não é necessário refatorar o repositório inteiro de uma vez.

## Checklist antes de entregar diff

1. [ ] Input de usuário/rede passou por schema Zod?
2. [ ] Tipo exportado com `z.infer` (sem duplicar interface)?
3. [ ] Schema em `modules/*/lib/`, não só inline na rota?
4. [ ] Erro 400 com mensagem compreensível em pt-BR?
5. [ ] Testes cobrem pelo menos um caso inválido do schema?
6. [ ] Não confundir `schema.ts` (Drizzle) com arquivo de validação Zod?

## Relacionados

- [AGENTS.md](../AGENTS.md) — stack, rotas, convenções gerais
- [shadcn-for-agents.md](shadcn-for-agents.md) — UI (formulários podem compartilhar o mesmo schema no server)

---

*Última revisão: 2026-06-01 — política “Zod first” para validação runtime.*
