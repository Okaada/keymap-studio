// Acompanhamento do build remoto (GitHub Actions) do repo de build, via `gh`.
// Sem toolchain local: só orquestra o CI que já existe e disponibiliza os .uf2.

import { readdir, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "./repo.js";

const gh = (cfg, args) => exec("gh", args, { cwd: cfg.path });

// Normaliza a saída de `gh run list ... --json` num status enxuto.
export function normalizeRun(stdout) {
  let arr;
  try { arr = JSON.parse(stdout || "[]"); } catch { return { none: true }; }
  if (!Array.isArray(arr) || !arr.length) return { none: true };
  const r = arr[0];
  return {
    runId: r.databaseId ?? null,
    status: r.status ?? null,          // queued | in_progress | completed
    conclusion: r.conclusion ?? null,  // success | failure | cancelled | ...
    url: r.url ?? null,
    workflow: r.workflowName ?? null,
  };
}

// Último run da branch. { runId, status, conclusion, url } ou { none: true }.
export async function buildStatus(cfg, branch) {
  const r = await gh(cfg, ["run", "list", "--branch", branch, "--limit", "1",
    "--json", "databaseId,status,conclusion,url,workflowName,createdAt"]);
  if (r.code !== 0) return { none: true, error: r.stderr.trim() || "gh run list falhou" };
  return normalizeRun(r.stdout);
}

// Trecho acionável do log de um run que falhou.
export async function buildLogFailed(cfg, runId) {
  const r = await gh(cfg, ["run", "view", String(runId), "--log-failed"]);
  const lines = (r.stdout || "")
    .split("\n")
    .map((l) => l.replace(/^.*\tUNKNOWN STEP\t/, "").replace(/^\S+\t\S+\t\S+\t/, ""))
    .filter((l) => /error|invalid|fatal|expected|undeclared|failed|cmake error|no devicetree/i.test(l))
    .filter((l) => !/git config|extraheader|includeif/i.test(l));
  const uniq = [...new Set(lines)].slice(0, 20);
  return uniq.length ? uniq.join("\n") : (r.stdout || "").split("\n").slice(-20).join("\n");
}

// Seleciona os .uf2 de um diretório (recursivo raso: gh cria subpastas por artefato).
export async function findUf2(destDir) {
  const out = [];
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith(".uf2")) out.push({ name: e.name, path: p });
    }
  }
  await walk(destDir);
  return out;
}

// Baixa os artefatos do run e devolve os .uf2 encontrados. Sem artefato → [].
export async function listFirmware(cfg, runId, destDir) {
  await rm(destDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(destDir, { recursive: true });
  const r = await gh(cfg, ["run", "download", String(runId), "--dir", destDir]);
  // code != 0 normalmente = "no artifacts" ou sem permissão → degrada pra []
  if (r.code !== 0) return [];
  return findUf2(destDir);
}
