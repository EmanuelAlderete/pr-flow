import { describe, expect, it, vi } from "vitest";

const getPortainerStatus = vi.fn();
const startPortainer = vi.fn();

vi.mock("@/modules/local-docker/lib/local-docker-portainer-service", () => ({
  getPortainerStatus: (...args: unknown[]) => getPortainerStatus(...args),
  startPortainer: (...args: unknown[]) => startPortainer(...args)
}));

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: vi.fn()
}));

describe("GET /api/devtools/local-docker/status", () => {
  it("returns portainer status", async () => {
    getPortainerStatus.mockResolvedValue({
      configured: true,
      portainerUrl: "https://localhost:9443",
      state: "running",
      containerName: "portainer",
      statusText: "Up 1 minute"
    });

    const { GET } = await import("@/app/api/devtools/local-docker/status/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.state).toBe("running");
  });
});

describe("POST /api/devtools/local-docker/start", () => {
  it("starts portainer and returns ok", async () => {
    startPortainer.mockResolvedValue({
      status: "ok",
      message: "Portainer em execução.",
      portainerUrl: "https://localhost:9443",
      state: "running"
    });

    const { POST } = await import("@/app/api/devtools/local-docker/start/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ok");
    expect(startPortainer).toHaveBeenCalled();
  });
});
