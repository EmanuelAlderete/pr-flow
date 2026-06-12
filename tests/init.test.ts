import { describe, it, expect, vi } from "vitest";
import { initializeApp } from "@/lib/init";
import * as ghLoggerModule from "@/modules/prs/lib/gh-logger";

describe("initializeApp", () => {
  it("should validate log directory on app initialization", () => {
    const validateSpy = vi.spyOn(ghLoggerModule.ghLogger, "validateLogDirectory");

    initializeApp();

    expect(validateSpy).toHaveBeenCalled();
    validateSpy.mockRestore();
  });

  it("should skip validation during next build", () => {
    const validateSpy = vi.spyOn(ghLoggerModule.ghLogger, "validateLogDirectory");
    const previousPhase = process.env.NEXT_PHASE;
    process.env.NEXT_PHASE = "phase-production-build";

    initializeApp();

    expect(validateSpy).not.toHaveBeenCalled();

    if (previousPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = previousPhase;
    }
    validateSpy.mockRestore();
  });

  it("should throw error if log directory validation fails", () => {
    const validateSpy = vi.spyOn(ghLoggerModule.ghLogger, "validateLogDirectory").mockImplementation(() => {
      throw new Error("Log directory not writable");
    });

    expect(() => {
      initializeApp();
    }).toThrow(/Log directory not writable/);

    validateSpy.mockRestore();
  });
});
