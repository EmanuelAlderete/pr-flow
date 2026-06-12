import { describe, expect, it } from "vitest";
import { formatPrOpenDuration } from "@/modules/prs/lib/core/format-pr-open-duration";

describe("formatPrOpenDuration", () => {
  it("exibe apenas a maior unidade de tempo", () => {
    const now = new Date("2026-05-28T15:10:42Z");
    const createdAt = "2026-05-26T12:00:00Z";

    expect(formatPrOpenDuration(createdAt, now)).toBe("aberta há 2 dias");
  });

  it("prioriza horas quando nao ha dias completos", () => {
    const now = new Date("2026-05-28T12:00:10Z");
    expect(formatPrOpenDuration("2026-05-28T10:00:00Z", now)).toBe("aberta há 2 horas");
  });

  it("formata apenas segundos quando a PR acabou de abrir", () => {
    const now = new Date("2026-05-28T12:00:05Z");
    expect(formatPrOpenDuration("2026-05-28T12:00:00Z", now)).toBe("aberta há 5 segundos");
  });

  it("retorna fallback para data invalida", () => {
    expect(formatPrOpenDuration("invalid-date")).toBe("aberta há tempo indeterminado");
  });
});
