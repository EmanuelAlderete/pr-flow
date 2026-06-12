import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getScheduledCronJob,
  isCronJobDisabled,
  registerScheduledCrons,
  resetCronSchedulingForTests,
  type CronJobSchedule,
  type CronScheduler
} from "@/modules/cron-scheduling";

describe("cron-scheduling", () => {
  afterEach(() => {
    resetCronSchedulingForTests();
    vi.unstubAllEnvs();
  });

  describe("isCronJobDisabled", () => {
    it("retorna true quando a variável de desabilitação do job está em 1", () => {
      const job = getScheduledCronJob("cron:prs-sync");
      expect(isCronJobDisabled(job, { DISABLE_PR_SYNC_CRON: "1" })).toBe(true);
      expect(isCronJobDisabled(job, { DISABLE_PR_SYNC_CRON: "0" })).toBe(false);
    });

    it("não desliga o briefing do dash com DISABLE_SUMMARY_CRON (só resumos)", () => {
      const resumos = getScheduledCronJob("cron:summaries-daily");
      const briefing = getScheduledCronJob("cron:dashboard-briefing");
      const env = { DISABLE_SUMMARY_CRON: "1" };

      expect(isCronJobDisabled(resumos, env)).toBe(true);
      expect(isCronJobDisabled(briefing, env)).toBe(false);
    });

    it("desliga o briefing do dash apenas com DISABLE_DASHBOARD_BRIEFING_CRON", () => {
      const briefing = getScheduledCronJob("cron:dashboard-briefing");

      expect(isCronJobDisabled(briefing, { DISABLE_DASHBOARD_BRIEFING_CRON: "1" })).toBe(true);
      expect(isCronJobDisabled(briefing, {})).toBe(false);
    });
  });

  describe("registerScheduledCrons", () => {
    function fakeScheduler(): CronScheduler & { calls: Array<{ expression: string; timezone?: string }> } {
      const calls: Array<{ expression: string; timezone?: string }> = [];
      return {
        calls,
        schedule(expression, _callback, options) {
          calls.push({ expression, timezone: options?.timezone });
        }
      };
    }

    const sampleJob = (overrides?: Partial<CronJobSchedule>): CronJobSchedule => ({
      id: "cron:prs-sync",
      expression: "*/10 * * * *",
      disableEnvVar: "DISABLE_PR_SYNC_CRON",
      run: vi.fn(),
      ...overrides
    });

    it("agenda jobs habilitados no scheduler injetado", () => {
      const scheduler = fakeScheduler();
      const job = sampleJob();

      registerScheduledCrons([job], { scheduler, env: {} });

      expect(scheduler.calls).toEqual([{ expression: "*/10 * * * *", timezone: undefined }]);
    });

    it("ignora jobs desabilitados e notifica via callback", () => {
      const scheduler = fakeScheduler();
      const onDisabled = vi.fn();
      const job = sampleJob();

      registerScheduledCrons([job], {
        scheduler,
        env: { DISABLE_PR_SYNC_CRON: "1" },
        onDisabled
      });

      expect(scheduler.calls).toEqual([]);
      expect(onDisabled).toHaveBeenCalledWith(job);
    });

    it("executa runOnStart antes de agendar quando o job está habilitado", () => {
      const scheduler = fakeScheduler();
      const run = vi.fn();
      const job = sampleJob({ runOnStart: true, run });

      registerScheduledCrons([job], { scheduler, env: {} });

      expect(run).toHaveBeenCalledOnce();
      expect(scheduler.calls).toHaveLength(1);
    });

    it("aplica SUMMARY_CRON_TZ nos jobs com useSummaryTimezone", () => {
      const scheduler = fakeScheduler();
      const job: CronJobSchedule = {
        id: "cron:summaries-daily",
        expression: "0 0 * * *",
        disableEnvVar: "DISABLE_SUMMARY_CRON",
        useSummaryTimezone: true,
        run: vi.fn()
      };

      registerScheduledCrons([job], {
        scheduler,
        env: { SUMMARY_CRON_TZ: "Europe/Lisbon" }
      });

      expect(scheduler.calls[0]?.timezone).toBe("Europe/Lisbon");
    });
  });

  describe("runCronCatchupOnStart", () => {
    it("não chama catchup quando DISABLE_SUMMARY_CRON=1", async () => {
      const catchupModule = await import("@/modules/summaries/lib/summary-catchup");
      const catchupSpy = vi.spyOn(catchupModule, "runSummaryCatchup").mockResolvedValue({
        dailyGenerated: [],
        dailySkipped: [],
        dailyFailed: [],
        weeklyGenerated: [],
        weeklySkipped: [],
        weeklyFailed: []
      });

      const { runCronCatchupOnStart } = await import(
        "@/modules/cron-scheduling/lib/run-cron-catchup-on-start"
      );
      await runCronCatchupOnStart({ DISABLE_SUMMARY_CRON: "1" });

      expect(catchupSpy).not.toHaveBeenCalled();
      catchupSpy.mockRestore();
    });

    it("executa catchup de resumos quando crons de resumo estão habilitadas", async () => {
      const catchupModule = await import("@/modules/summaries/lib/summary-catchup");
      const report = {
        dailyGenerated: ["2026-05-27"],
        dailySkipped: [],
        dailyFailed: [],
        weeklyGenerated: [],
        weeklySkipped: ["2026-05-18"],
        weeklyFailed: []
      };
      const catchupSpy = vi.spyOn(catchupModule, "runSummaryCatchup").mockResolvedValue(report);

      const { runCronCatchupOnStart } = await import(
        "@/modules/cron-scheduling/lib/run-cron-catchup-on-start"
      );
      await runCronCatchupOnStart({});

      expect(catchupSpy).toHaveBeenCalledOnce();
      catchupSpy.mockRestore();
    });
  });

  describe("startAllCrons", () => {
    it("registra jobs apenas uma vez", async () => {
      const registerModule = await import("@/modules/cron-scheduling/lib/register-scheduled-crons");
      const startModule = await import("@/modules/cron-scheduling/lib/start-all-crons");
      const registerSpy = vi.spyOn(registerModule, "registerScheduledCrons").mockImplementation(() => {});

      startModule.resetCronSchedulingStateForTests();
      startModule.startAllCrons();
      startModule.startAllCrons();

      expect(registerSpy).toHaveBeenCalledOnce();
      registerSpy.mockRestore();
      startModule.resetCronSchedulingStateForTests();
    });

    it("dispara catchup de resumos no boot", async () => {
      const registerModule = await import("@/modules/cron-scheduling/lib/register-scheduled-crons");
      const catchupModule = await import("@/modules/cron-scheduling/lib/run-cron-catchup-on-start");
      const startModule = await import("@/modules/cron-scheduling/lib/start-all-crons");

      vi.spyOn(registerModule, "registerScheduledCrons").mockImplementation(() => {});
      const catchupSpy = vi.spyOn(catchupModule, "runCronCatchupOnStart").mockResolvedValue();

      startModule.resetCronSchedulingStateForTests();
      startModule.startAllCrons();

      expect(catchupSpy).toHaveBeenCalledOnce();
      startModule.resetCronSchedulingStateForTests();
    });
  });
});
