#!/usr/bin/env node
/**
 * Next.js com output: "standalone" não suporta `next start` para rotas aninhadas.
 * Este script prepara assets estáticos e sobe `.next/standalone/server.js`.
 */
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");
const serverEntry = path.join(standaloneDir, "server.js");

if (!existsSync(serverEntry)) {
  console.error("Build standalone ausente. Rode: npm run build");
  process.exit(1);
}

cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), {
  recursive: true,
  force: true
});
cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  force: true
});

const port = process.env.PORT?.trim() || "3847";
const env = {
  ...process.env,
  PORT: port,
  HOSTNAME: process.env.HOSTNAME?.trim() || "0.0.0.0"
};

const child = spawn(process.execPath, [serverEntry], {
  cwd: standaloneDir,
  env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
