import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;

describe("db (seam público)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("getDb throws when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;

    const { getDb } = await import("@/modules/db/lib/db");

    expect(() => getDb()).toThrow("DATABASE_URL is not set");
  });

  it("closeDb is safe when no connection was opened", async () => {
    const { closeDb } = await import("@/modules/db/lib/db");

    await expect(closeDb()).resolves.toBeUndefined();
  });
});
