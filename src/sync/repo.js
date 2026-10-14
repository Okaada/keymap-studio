// Integração com o repo de build (D1): orquestra `git`/`gh` já autenticados, com cwd
// no repo de build. Preview é read-only (D3); sync só roda sob confirmação do servidor.

import { execFile } from "node:child_process";
import { copyFile, readFile } from "node:fs/promises";
import { join, isAbsolute, resolve } from "node:path";
import { diffText } from "../keymap/diff.js";
import { parseKeymap } from "../keymap/parser.js";
import { visualDiff } from "../keymap/visualDiff.js";

function git(cfg, args, opts = {}) {
  return exec("git", args, { cwd: cfg.path, ...opts });
}

export function exec(cmd, args, opts = {}) {
  return new Promise((resolveP) => {
    execFile(cmd, args, { maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) => {
      resolveP({ code: err ? (err.code ?? 1) : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

function destPath(cfg) {
  return join(cfg.path, cfg.keymapDest);
}

// owner/repo a partir do remote (git@github.com:owner/repo.git ou https://github.com/owner/repo)
async function remoteSlug(cfg) {
  const r = await git(cfg, ["remote", "get-url", cfg.remote || "origin"]);
  const url = r.stdout.trim();
  const m = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(url);
  return m ? { owner: m[1], repo: m[2], url } : null;
}

export async function currentBranch(cfg) {
  const r = await git(cfg, ["rev-parse", "--abbrev-ref", "HEAD"]);
  return r.stdout.trim();
}

export async function isClean(cfg) {
  const r = await git(cfg, ["status", "--porcelain"]);
  return r.stdout.trim() === "";
}

// Pré-checagem (D4): repo limpo e na branch base; senão, erro acionável.
export async function precheck(cfg) {
  const branch = await currentBranch(cfg);
  if (branch !== cfg.baseBranch) {
    return { ok: false, code: "wrong-branch", message: `Repo de build está em "${branch}", esperado "${cfg.baseBranch}". Troque de branch antes de sincronizar.` };
  }
  if (!(await isClean(cfg))) {
    return { ok: false, code: "dirty", message: "Repo de build tem alterações não commitadas. Resolva-as antes de sincronizar (o sync não quer misturar mudanças não relacionadas)." };
  }
  return { ok: true, branch };
}

// Preview read-only (D3): diff entre o keymap local e o destino no repo.
// Textual via helper compartilhado + visual (estruturado) parseando os dois arquivos.
export async function preview(cfg, localKeymapPath) {
  const dest = destPath(cfg);
  const [a, b] = await Promise.all([
    readFile(dest, "utf8").catch(() => null),
    readFile(localKeymapPath, "utf8"),
  ]);
  const { changed, diff } = await diffText(a, b, { labelA: "build-repo", labelB: "local" });
  // Diff visual: antes = repo de build (a), depois = local (b). Nulo se destino
  // ausente ou se algum .keymap não parsear (cai no textual na UI).
  let visual = null;
  if (a != null) {
    try {
      const before = parseKeymap(a);
      const after = parseKeymap(b);
      visual = {
        ...visualDiff({
          layersBefore: before.layers,
          layersAfter: after.layers,
          dnBefore: before.layers.map((l) => l.displayName ?? null),
          dnAfter: after.layers.map((l) => l.displayName ?? null),
          behaviorsBefore: before.behaviors,
          behaviorsAfter: after.behaviors,
        }),
        afterLayers: after.layers.map((l) => ({ name: l.name, displayName: l.displayName ?? null, bindings: l.bindings })),
      };
    } catch {
      visual = null;
    }
  }
  return { changed, diff, visual };
}

// Reconciliação build→editor: atualiza o clone (fetch + ff-only da base) e traz o
// keymap do repo pro editor. Repo vence após merge, mas só sobrescreve com `adopt`.
export async function pullFromBuild(cfg, localKeymapPath, { adopt = false } = {}) {
  const pre = await precheck(cfg);
  if (!pre.ok) return { ok: false, ...pre };

  const remote = cfg.remote || "origin";
  const base = cfg.baseBranch;
  const fetch = await git(cfg, ["fetch", remote, base]);
  if (fetch.code !== 0) return { ok: false, code: "fetch", message: `Falha no fetch: ${fetch.stderr.trim()}` };
  const ff = await git(cfg, ["merge", "--ff-only", `${remote}/${base}`]);
  if (ff.code !== 0) return { ok: false, code: "no-ff", message: `Não foi fast-forward (o clone do build divergiu do remoto). Resolva no repo antes: ${ff.stderr.trim()}` };

  const dest = destPath(cfg);
  const [repoText, localText] = await Promise.all([
    readFile(dest, "utf8").catch(() => null),
    readFile(localKeymapPath, "utf8").catch(() => null),
  ]);
  if (repoText == null) return { ok: false, code: "no-dest", message: `Keymap não encontrado no repo de build: ${cfg.keymapDest}` };
  if (repoText === localText) return { ok: true, changed: false };

  if (adopt) {
    await copyFile(dest, localKeymapPath);
    return { ok: true, changed: true, adopted: true };
  }

  // Preview (sem sobrescrever): o que adotar do repo mudaria no editor (antes=local, depois=repo).
  const { diff } = await diffText(localText, repoText, { labelA: "editor", labelB: "build-repo" });
  let visual = null;
  try {
    const before = parseKeymap(localText ?? "");
    const after = parseKeymap(repoText);
    visual = {
      ...visualDiff({
        layersBefore: before.layers,
        layersAfter: after.layers,
        dnBefore: before.layers.map((l) => l.displayName ?? null),
        dnAfter: after.layers.map((l) => l.displayName ?? null),
        behaviorsBefore: before.behaviors,
        behaviorsAfter: after.behaviors,
      }),
      afterLayers: after.layers.map((l) => ({ name: l.name, displayName: l.displayName ?? null, bindings: l.bindings })),
    };
  } catch { visual = null; }
  return { ok: true, changed: true, adopted: false, diff, visual };
}

async function ghReady() {
  const r = await exec("gh", ["auth", "status"]);
  return r.code === 0;
}

// Sync (D2): base limpa → branch → copiar → commit → push → PR.
export async function sync(cfg, localKeymapPath, { message, stamp } = {}) {
  const pre = await precheck(cfg);
  if (!pre.ok) return { ok: false, ...pre };

  const pv = await preview(cfg, localKeymapPath);
  if (!pv.changed) return { ok: false, code: "no-change", message: "Nada a sincronizar: o keymap local é idêntico ao do repo de build." };

  const branch = `keymap-update-${stamp || "manual"}`;
  const title = message || "Update lily58 keymap";
  const base = cfg.baseBranch;
  const remote = cfg.remote || "origin";

  const sw = await git(cfg, ["switch", "-c", branch]);
  if (sw.code !== 0) return { ok: false, code: "git", message: `Falha ao criar branch: ${sw.stderr.trim()}` };

  // copia o keymap local para o destino no repo e commita
  await copyFile(localKeymapPath, destPath(cfg));
  await git(cfg, ["add", "--", cfg.keymapDest]);
  const ci = await git(cfg, ["commit", "-m", title]);
  if (ci.code !== 0) {
    await git(cfg, ["switch", base]);
    await git(cfg, ["branch", "-D", branch]);
    return { ok: false, code: "git", message: `Falha no commit: ${ci.stderr.trim()}` };
  }

  const push = await git(cfg, ["push", "-u", remote, branch]);
  if (push.code !== 0) {
    // rollback: volta pra base e remove a branch (o keymap local é a fonte da verdade;
    // nada se perde e o repo de build não fica numa branch pendente).
    await git(cfg, ["switch", base]);
    await git(cfg, ["branch", "-D", branch]);
    return { ok: false, code: "push", message: `Falha no push: ${push.stderr.trim()}`, branch };
  }

  // PR via gh; fallback para compare URL se gh indisponível/sem acesso (D5).
  let result;
  if (await ghReady()) {
    const pr = await exec("gh", ["pr", "create", "--base", base, "--head", branch, "--title", title, "--body", "Keymap atualizado via ZMK Visual Configurator."], { cwd: cfg.path });
    if (pr.code === 0) result = { ok: true, branch, prUrl: pr.stdout.trim() };
  }
  if (!result) {
    const slug = await remoteSlug(cfg);
    const compareUrl = slug ? `https://github.com/${slug.owner}/${slug.repo}/compare/${base}...${branch}?expand=1` : null;
    result = { ok: true, branch, prUrl: null, compareUrl, warning: "Branch enviada e build disparado. O PR não foi aberto automaticamente (gh sem acesso de escrita); use o link de compare para abrir o PR." };
  }

  // Volta pra base para o repo ficar pronto pro próximo sync (a branch enviada permanece).
  await git(cfg, ["switch", base]);
  return result;
}

export function resolveBuildRepo(cfg, root) {
  const path = isAbsolute(cfg.path) ? cfg.path : resolve(root, cfg.path);
  return { ...cfg, path };
}
