export function buildQuickNoteClassificationPrompt(text: string): string {
  return `Você classifica entradas rápidas de um desenvolvedor no PR Flow (app de produtividade).

Texto do usuário:
"""
${text}
"""

Destinos:
- "journal": reflexão, contexto, decisão, anotação ou log do dia — não é uma ação concreta.
- "task": ação concreta a fazer (TODO, lembrete, implementar, revisar, corrigir, ligar, etc.).

Responda APENAS com um objeto JSON válido (sem markdown, sem texto extra), exatamente neste formato:
{"destination":"journal"|"task","title":string|null,"description":string|null,"dueDate":string|null}

Regras:
- Se destination for "journal", use title null, description null e dueDate null.
- Se destination for "task", title é obrigatório: curto, imperativo, em português do Brasil (máximo 200 caracteres).
- description: detalhes opcionais da tarefa, ou null.
- dueDate: use "YYYY-MM-DD" somente se o texto mencionar prazo explícito; caso contrário null.
- Na dúvida entre journal e task, prefira "journal".`;
}
