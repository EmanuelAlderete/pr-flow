import {
  getLocalDockerComposeContext,
  getLocalDockerPortainerUrl,
  isLocalDockerConfigured,
  LOCAL_DOCKER_PROJECT_NAME,
  PORTAINER_SERVICE_NAME
} from "@/modules/local-docker/lib/local-docker-config";
import {
  buildComposeArgs,
  defaultComposeRunner,
  type ComposeRunner
} from "@/modules/local-docker/lib/local-docker-compose-runner";
import { parseComposePsJson } from "@/modules/local-docker/lib/local-docker-validation";

export type PortainerRuntimeState = "stopped" | "starting" | "running" | "unhealthy";

export type PortainerStatus = {
  configured: boolean;
  portainerUrl: string;
  state: PortainerRuntimeState;
  containerName: string | null;
  statusText: string | null;
};

export type PortainerStartResult = {
  status: "ok" | "error";
  message: string;
  portainerUrl: string;
  state: PortainerRuntimeState;
};

function mapComposeState(state: string, status: string, health?: string): PortainerRuntimeState {
  const normalized = state.toLowerCase();

  if (normalized === "running") {
    if (health && health.length > 0 && health.toLowerCase() !== "healthy") {
      return "unhealthy";
    }
    return "running";
  }

  if (normalized === "restarting" || /starting/i.test(status)) {
    return "starting";
  }

  return "stopped";
}

async function loadPortainerRow(
  run: ComposeRunner = defaultComposeRunner
): Promise<{ row: ReturnType<typeof parseComposePsJson>[number] | null }> {
  const { composeRoot, composeFilePath, env } = getLocalDockerComposeContext();
  const args = buildComposeArgs(composeFilePath, [
    "-p",
    LOCAL_DOCKER_PROJECT_NAME,
    "ps",
    PORTAINER_SERVICE_NAME,
    "--format",
    "json"
  ]);

  const output = await run(args, { cwd: composeRoot, env });

  if (output.exitCode !== 0) {
    throw new Error(output.stderr.trim() || "Falha ao consultar status do Portainer.");
  }

  const rows = parseComposePsJson(output.stdout);
  return { row: rows[0] ?? null };
}

export async function getPortainerStatus(
  run: ComposeRunner = defaultComposeRunner
): Promise<PortainerStatus> {
  const portainerUrl = getLocalDockerPortainerUrl();

  if (!isLocalDockerConfigured()) {
    return {
      configured: false,
      portainerUrl,
      state: "stopped",
      containerName: null,
      statusText: null
    };
  }

  try {
    const { row } = await loadPortainerRow(run);

    if (!row) {
      return {
        configured: true,
        portainerUrl,
        state: "stopped",
        containerName: null,
        statusText: null
      };
    }

    return {
      configured: true,
      portainerUrl,
      state: mapComposeState(row.State, row.Status, row.Health),
      containerName: row.Name,
      statusText: row.Status
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar Portainer.";
    return {
      configured: true,
      portainerUrl,
      state: "stopped",
      containerName: null,
      statusText: message
    };
  }
}

export async function startPortainer(
  run: ComposeRunner = defaultComposeRunner
): Promise<PortainerStartResult> {
  const portainerUrl = getLocalDockerPortainerUrl();
  const { composeRoot, composeFilePath, env } = getLocalDockerComposeContext();

  const args = buildComposeArgs(composeFilePath, [
    "-p",
    LOCAL_DOCKER_PROJECT_NAME,
    "up",
    "-d",
    PORTAINER_SERVICE_NAME
  ]);

  const output = await run(args, { cwd: composeRoot, env });

  if (output.exitCode !== 0) {
    return {
      status: "error",
      message: output.stderr.trim() || "Não foi possível subir o Portainer.",
      portainerUrl,
      state: "stopped"
    };
  }

  const status = await getPortainerStatus(run);

  return {
    status: "ok",
    message:
      status.state === "running"
        ? "Portainer em execução. Abra o painel para gerenciar o stack local."
        : "Portainer iniciado. Aguarde alguns segundos e abra o painel.",
    portainerUrl,
    state: status.state
  };
}
