import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/modules/db/lib/db", () => ({
  getDb: () => ({
    select: selectMock,
    insert: insertMock
  })
}));

describe("github-login-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getGithubLogin returns null when no row exists", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const { getGithubLogin } = await import("@/modules/app/lib/github-login-repository");
    await expect(getGithubLogin()).resolves.toBeNull();
  });

  it("getGithubLogin returns stored login", async () => {
    const limit = vi.fn().mockResolvedValue([{ githubLogin: "rigon" }]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const { getGithubLogin } = await import("@/modules/app/lib/github-login-repository");
    await expect(getGithubLogin()).resolves.toBe("rigon");
  });

  it("saveGithubLogin upserts trimmed login", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    insertMock.mockReturnValue({ values });

    const { saveGithubLogin } = await import("@/modules/app/lib/github-login-repository");
    await saveGithubLogin("  rigon  ");

    expect(values).toHaveBeenCalledWith({
      id: "default",
      githubLogin: "rigon",
      updatedAt: expect.any(Date)
    });
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it("saveGithubLogin ignores empty values", async () => {
    const { saveGithubLogin } = await import("@/modules/app/lib/github-login-repository");
    await saveGithubLogin("   ");
    expect(insertMock).not.toHaveBeenCalled();
  });
});
