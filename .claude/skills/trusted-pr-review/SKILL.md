---
name: trusted-pr-review
description: Revisão de pull request com os 7 pilares do review confiável. Use ao revisar uma PR com contexto do repositório, subagentes focados e modelo barato. Não aprova nem rejeita a PR.
---

# Review confiável

Você orquestra uma revisão local. A saída é uma sugestão para um humano. Você não aprova, não rejeita, não comenta e não faz merge no GitHub.

Os documentos deste repositório são a lei. Skills, `CLAUDE.md`, `docs/` e specs daqui vencem o conhecimento geral do modelo. Não invente regra que não esteja no projeto.

## Pilares

1. **Especialização.** Seis subagentes focados, cada um com escopo, docs e checklist próprios. Um agente não lê o relatório do outro.
2. **Grounding.** Abra pelo menos 7 documentos do projeto antes de comentar o diff. Se houver menos, abra todos e liste os que existem.
3. **Second pass.** Um subagente relê o diff inteiro, lista o que não foi comentado e justifica por que está limpo.
4. **Precision > recall.** Limiar de 80% de confiança. Se incerto, não reporte. Melhor omitir do que reportar errado.
5. **Human-in-the-loop.** A IA sugere. O humano decide. Nunca aprove nem rejeite a PR.
6. **Rastreabilidade.** Confira Jira e arquivos de spec contra o diff, item a item. Revise a entrega, não só o código.
7. **Meta-review.** Um subagente dedicado derruba alucinação: import fantasma, código morto, assinatura que não existe no arquivo.

## Subagentes

Dispare com o Agent tool, modelo `{{REVIEW_MODEL}}`, nesta ordem. No parâmetro `model` de cada chamada, use exatamente esse modelo. Não troque por outro.

1. `correctness`, `security`, `contracts`, `tests`, `delivery`, `conventions` — em paralelo, sem ver o relatório uns dos outros.
2. `second-pass` — recebe o diff inteiro e os achados que sobraram.
3. `meta-review` — confere cada achado no código e lista os que devem ser descartados.

## Diff

Leia o diff completo (`git diff <base>...HEAD` ou `gh pr diff <número>`). Não revise só um trecho.

## Saída

Responda só com JSON:

```json
{
  "summary": "pt-BR, sem aprovar nem rejeitar",
  "docsLoaded": ["README.md"],
  "findings": [
    {
      "agent": "correctness",
      "path": "src/exemplo.ts",
      "line": 10,
      "message": "o que está errado, citado no código",
      "confidence": 0.9
    }
  ],
  "notCommented": ["arquivo ou hunk — por que ficou sem comentário"],
  "cleanJustification": "por que o restante está limpo",
  "traceability": [{ "item": "critério ou ticket", "status": "met" }],
  "metaReview": { "dropped": ["mensagem do achado descartado"], "notes": "o que o meta-review conferiu" }
}
```

`status` é `met`, `unmet` ou `unclear`. Não inclua achado com `confidence` abaixo de 0.8. `notCommented` e `traceability` têm pelo menos um item. Se não houver ticket ou spec, registre isso em `traceability` com `unclear`.
