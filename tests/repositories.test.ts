import { describe, expect, it } from "vitest";
import { parseMonitoredRepositories } from "@/modules/prs/lib/repositories";

describe("parseMonitoredRepositories", () => {
  it("transforma csv em lista de owner/repo", () => {
    expect(parseMonitoredRepositories("acme/a,acme/b")).toEqual(["acme/a", "acme/b"]);
  });

  it("remove espacos e entradas duplicadas", () => {
    expect(parseMonitoredRepositories(" acme/a , acme/a, acme/b ")).toEqual(["acme/a", "acme/b"]);
  });

  it("retorna vazio para input ausente", () => {
    expect(parseMonitoredRepositories(undefined)).toEqual([]);
  });
});
