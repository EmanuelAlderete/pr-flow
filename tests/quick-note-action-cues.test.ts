import { describe, expect, it } from "vitest";
import {
  findQuickNoteActionCues,
  hasQuickNoteActionCues
} from "@/modules/journal/lib/quick-note-action-cues";
import { buildQuickNoteClassificationPrompt } from "@/modules/journal/lib/quick-note-classification-prompt";
import { buildQuickNoteDateAnchors } from "@/modules/journal/lib/quick-note-date-anchors";

const GDC_NOTE = `Sobre a integração com GDC, estabelecida na jor-311, tivemos retorno hoje. O Christian me passou que já estava com o código pronto e que subiria em dev para testarmos a integração da Fila + Worker + endpoint do cms-service. Eu testei agora de noite e vi que o payload que está sendo enviado na mensagem está sem o campo oab no advgado das partes, o que faz com que o cms-service termine com um no_op. Já avisei essa falha para o Christian, mas amanhã ainda preciso falar isso na daily e com o Brunnelo.`;

describe("quick-note-action-cues", () => {
  it("detects embedded tomorrow/preciso commitment in a narrative note", () => {
    expect(hasQuickNoteActionCues(GDC_NOTE)).toBe(true);
    const cues = findQuickNoteActionCues(GDC_NOTE);
    expect(cues.some((cue) => /preciso/i.test(cue))).toBe(true);
    expect(cues.some((cue) => /amanh/i.test(cue))).toBe(true);
  });

  it("does not flag pure past-tense log without future commitment", () => {
    expect(
      hasQuickNoteActionCues(
        "Hoje testei a integração GDC e já avisei a falha do campo oab para o Christian."
      )
    ).toBe(false);
  });
});

describe("quick-note classification prompt for narrative + implicit task", () => {
  it("injects action cues and forbids empty tasks when cues exist", () => {
    const prompt = buildQuickNoteClassificationPrompt(
      GDC_NOTE,
      buildQuickNoteDateAnchors("2026-08-11")
    );

    expect(prompt).toContain("Sinais de ação já detectados");
    expect(prompt).toContain("NÃO devolva tasks: []");
    expect(prompt).toContain("Compromisso futuro");
    expect(prompt).toContain("dueRelative\":\"tomorrow\"");
  });
});
