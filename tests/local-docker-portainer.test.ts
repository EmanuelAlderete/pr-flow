import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComposeRunner } from "@/modules/local-docker/lib/local-docker-compose-runner";
import { parseComposePsJson } from "@/modules/local-docker/lib/local-docker-validation";

const LOCAL_DOCKER_ROOT = "/tmp/local-docker-test";

vi.mock("@/modules/local-docker/lib/local-docker-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/local-docker/lib/local-docker-config")>();
  return {
    ...actual,
    isLocalDockerConfigured: vi.fn(() => true),
    getLocalDockerComposeContext: vi.fn(() => ({
      composeRoot: LOCAL_DOCKER_ROOT,
      composeFilePath: `${LOCAL_DOCKER_ROOT}/docker-compose.dev.yml`,
      env: { LOCAL_DOCKER_ROOT, JUSFY_ROOT: "/tmp/jusfy" }
    })),
    getLocalDockerPortainerUrl: vi.fn(() => "https://localhost:9443")
  };
});

describe("parseComposePsJson", () => {
  it("parses newline-delimited compose ps json", () => {
    const rows = parseComposePsJson(
      `${JSON.stringify({
        Service: "portainer",
        Name: "portainer",
        State: "running",
        Status: "Up"
      })}\n`
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.Service).toBe("portainer");
  });
});

describe("local-docker portainer service", () => {
  beforeEach(async () => {
    vi.resetModules();
    const config = await import("@/modules/local-docker/lib/local-docker-config");
    vi.mocked(config.isLocalDockerConfigured).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports not configured when LOCAL_DOCKER_ROOT is missing", async () => {
    const config = await import("@/modules/local-docker/lib/local-docker-config");
    vi.mocked(config.isLocalDockerConfigured).mockReturnValue(false);

    const { getPortainerStatus } = await import(
      "@/modules/local-docker/lib/local-docker-portainer-service"
    );

    const status = await getPortainerStatus(vi.fn() as unknown as ComposeRunner);
    expect(status.configured).toBe(false);
    expect(status.state).toBe("stopped");
  });

  it("maps running Portainer from compose ps json", async () => {
    const runner: ComposeRunner = vi.fn(async () => ({
      stdout: JSON.stringify({
        Service: "portainer",
        Name: "portainer",
        State: "running",
        Status: "Up 2 minutes",
        Health: "healthy"
      }),
      stderr: "",
      exitCode: 0
    }));

    const { getPortainerStatus } = await import(
      "@/modules/local-docker/lib/local-docker-portainer-service"
    );

    const status = await getPortainerStatus(runner);
    expect(status.configured).toBe(true);
    expect(status.state).toBe("running");
    expect(status.containerName).toBe("portainer");
  });

  it("starts Portainer with compose up -d portainer", async () => {
    const runner = vi.fn(async (args: string[]) => {
      if (args.includes("up")) {
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      return {
        stdout: JSON.stringify({
          Service: "portainer",
          Name: "portainer",
          State: "running",
          Status: "Up 1 second"
        }),
        stderr: "",
        exitCode: 0
      };
    }) as unknown as ComposeRunner;

    const { startPortainer } = await import(
      "@/modules/local-docker/lib/local-docker-portainer-service"
    );

    const result = await startPortainer(runner);
    expect(result.status).toBe("ok");
    expect(runner).toHaveBeenCalled();
    const firstCallArgs = vi.mocked(runner).mock.calls[0]?.[0] ?? [];
    expect(firstCallArgs).toContain("up");
    expect(firstCallArgs).toContain("portainer");
  });
});
