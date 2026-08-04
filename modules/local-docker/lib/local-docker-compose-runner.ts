import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const COMPOSE_EXEC_MAX_BUFFER_BYTES = 4 * 1024 * 1024;

export interface ComposeCommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type ComposeRunner = (
  args: string[],
  options: { cwd: string; env: Record<string, string | undefined> }
) => Promise<ComposeCommandOutput>;

export async function defaultComposeRunner(
  args: string[],
  options: { cwd: string; env: Record<string, string | undefined> }
): Promise<ComposeCommandOutput> {
  try {
    const result = await execFileAsync("docker", args, {
      cwd: options.cwd,
      env: options.env as NodeJS.ProcessEnv,
      maxBuffer: COMPOSE_EXEC_MAX_BUFFER_BYTES
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      code?: string | number;
      message?: string;
    };
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      exitCode: typeof err.code === "number" ? err.code : 1
    };
  }
}

export function buildComposeArgs(composeFilePath: string, composeArgs: string[]): string[] {
  return ["compose", "-f", composeFilePath, ...composeArgs];
}
