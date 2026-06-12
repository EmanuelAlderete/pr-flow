import { describe, expect, it, vi } from "vitest";
import { CRON_MANUAL_CONFIRMATION_PHRASE } from "@/modules/devtools/lib/cron-confirmation";

const runCronJob = vi.fn();

vi.mock("@/modules/devtools/lib/cron-job-runners", () => ({
  runCronJob: (...args: unknown[]) => runCronJob(...args)
}));

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: vi.fn()
}));

describe("POST /api/devtools/crons/run", () => {
  it("rejeita frase de confirmação incorreta", async () => {
    const { POST } = await import("@/app/api/devtools/crons/run/route");
    const response = await POST(
      new Request("http://localhost/api/devtools/crons/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "cron:prs-sync",
          confirmationPhrase: "frase errada"
        })
      })
    );

    expect(response.status).toBe(403);
    expect(runCronJob).not.toHaveBeenCalled();
  });

  it("executa job com frase válida", async () => {
    runCronJob.mockResolvedValue({
      jobId: "cron:prs-sync",
      status: "ok",
      message: "Sincronização concluída (3 PRs)."
    });

    const { POST } = await import("@/app/api/devtools/crons/run/route");
    const response = await POST(
      new Request("http://localhost/api/devtools/crons/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "cron:prs-sync",
          confirmationPhrase: CRON_MANUAL_CONFIRMATION_PHRASE
        })
      })
    );

    expect(response.status).toBe(200);
    expect(runCronJob).toHaveBeenCalledWith("cron:prs-sync", true);

    const { writeSystemLogFireAndForget } = await import(
      "@/modules/observability/lib/system-logger"
    );
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "api:cron-run",
        message: expect.stringContaining("cron:prs-sync")
      })
    );
  });
});
