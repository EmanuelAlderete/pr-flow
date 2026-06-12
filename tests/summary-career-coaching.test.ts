import { afterEach, describe, expect, it } from "vitest";
import {
  buildSummaryCareerPersona,
  buildSummaryCareerRules,
  buildSummaryCareerSections,
  buildSummaryPromptGoldenRules,
  getSummaryCareerLevel
} from "@/modules/summaries/lib/summary-career-coaching";

describe("summary-career-coaching", () => {
  const originalLevel = process.env.SUMMARY_CAREER_LEVEL;

  afterEach(() => {
    if (originalLevel === undefined) {
      delete process.env.SUMMARY_CAREER_LEVEL;
    } else {
      process.env.SUMMARY_CAREER_LEVEL = originalLevel;
    }
  });

  it("usa junior como nível padrão", () => {
    delete process.env.SUMMARY_CAREER_LEVEL;
    expect(getSummaryCareerLevel()).toBe("junior");
    expect(buildSummaryCareerPersona()).toContain("desenvolvedor júnior");
  });

  it("aceita nível configurado via env", () => {
    process.env.SUMMARY_CAREER_LEVEL = "pleno";
    expect(getSummaryCareerLevel()).toBe("pleno");
    expect(buildSummaryCareerPersona()).toContain("desenvolvedor pleno");
  });

  it("inclui seções Feedback 3x3 no resumo diário e Bússola no semanal", () => {
    const daily = buildSummaryCareerSections("daily");
    expect(daily).toContain("## 🚀 Entregas (O Impacto)");
    expect(daily).toContain("## 🎯 Próximos Passos e Desbloqueios");
    expect(daily).toContain("## 💡 Mentalidade Sênior (Evolução Profissional)");

    const weekly = buildSummaryCareerSections("weekly");
    expect(weekly).toContain("## 📊 Balanço de Força");
    expect(weekly).toContain("## 🏔️ Grandes Marcos & Entregas");
    expect(weekly).toContain("## 🔍 Padrões Detectados & Riscos de Carreira");
    expect(weekly).toContain("## 📋 O que Cruzou a Fronteira");
  });

  it("inclui regras de ouro por escopo", () => {
    expect(buildSummaryPromptGoldenRules("weekly")).toContain("tech lead mentor");
    expect(buildSummaryPromptGoldenRules("dashboard")).toContain("sem coaching");
    expect(buildSummaryPromptGoldenRules("daily")).toContain("Proibido logs repetitivos");
  });

  it("prioriza foco de júnior nas regras diárias", () => {
    delete process.env.SUMMARY_CAREER_LEVEL;
    const rules = buildSummaryCareerRules("daily");
    expect(rules).toContain("alterações solicitadas");
    expect(rules).toContain("evolução para pleno");
  });
});
