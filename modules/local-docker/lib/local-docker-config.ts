import { accessSync } from "node:fs";
import { join } from "node:path";

export const LOCAL_DOCKER_COMPOSE_FILE = "docker-compose.dev.yml";
export const LOCAL_DOCKER_PROJECT_NAME = "jusfy-local";
export const PORTAINER_SERVICE_NAME = "portainer";
export const PORTAINER_CONTAINER_NAME = "portainer";

export class LocalDockerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalDockerConfigError";
  }
}

export function getLocalDockerPortainerUrl(): string {
  return process.env.LOCAL_DOCKER_PORTAINER_URL?.trim() || "https://localhost:9443";
}

export function isLocalDockerConfigured(): boolean {
  const root = process.env.LOCAL_DOCKER_ROOT?.trim();
  if (!root) {
    return false;
  }

  try {
    accessSync(join(root, LOCAL_DOCKER_COMPOSE_FILE));
    return true;
  } catch {
    return false;
  }
}

export function getLocalDockerComposeContext(): {
  composeRoot: string;
  composeFilePath: string;
  env: Record<string, string>;
} {
  const composeRoot = process.env.LOCAL_DOCKER_ROOT?.trim();
  if (!composeRoot) {
    throw new LocalDockerConfigError(
      "Configure LOCAL_DOCKER_ROOT no .env (pasta do docker-compose.dev.yml do stack Jusfy local)."
    );
  }

  const composeFilePath = join(composeRoot, LOCAL_DOCKER_COMPOSE_FILE);
  try {
    accessSync(composeFilePath);
  } catch {
    throw new LocalDockerConfigError(
      `Arquivo ${LOCAL_DOCKER_COMPOSE_FILE} não encontrado em LOCAL_DOCKER_ROOT (${composeRoot}).`
    );
  }

  const env: Record<string, string> = {
    ...process.env,
    LOCAL_DOCKER_ROOT: composeRoot
  };

  const jusfyRoot = process.env.JUSFY_ROOT?.trim();
  if (jusfyRoot) {
    env.JUSFY_ROOT = jusfyRoot;
  }

  return { composeRoot, composeFilePath, env };
}
