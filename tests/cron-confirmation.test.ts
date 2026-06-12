import { describe, expect, it } from "vitest";
import {
  CRON_MANUAL_CONFIRMATION_PHRASE,
  isCronManualConfirmationValid
} from "@/modules/devtools/lib/cron-confirmation";

describe("cron manual confirmation", () => {
  it("aceita apenas a frase exata", () => {
    expect(isCronManualConfirmationValid(CRON_MANUAL_CONFIRMATION_PHRASE)).toBe(true);
    expect(isCronManualConfirmationValid(`${CRON_MANUAL_CONFIRMATION_PHRASE} `)).toBe(false);
    expect(isCronManualConfirmationValid(CRON_MANUAL_CONFIRMATION_PHRASE.slice(0, -1))).toBe(false);
    expect(isCronManualConfirmationValid("confirmo execução manual")).toBe(false);
  });
});
