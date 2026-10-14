import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { tasks } from "@/modules/tasks/lib/schema";

describe("sqlite", () => {
  const previous = process.env.DATABASE_URL;
  const file = path.join(os.tmpdir(), `pr-flow-sqlite-${process.pid}.sqlite`);

  afterEach(async () => {
    const { closeDb } = await import("@/modules/db/lib/db");
    closeDb();
    if (previous === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous;
    }
  });

  it("aplica as migrations e grava uma tarefa", async () => {
    process.env.DATABASE_URL = `file:${file}`;
    const { getDb } = await import("@/modules/db/lib/db");
    const db = getDb();
    await db.insert(tasks).values({ title: "comprar café" });
    const rows = await db.select().from(tasks);
    expect(rows.map((row) => row.title)).toContain("comprar café");
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);
  });
});
