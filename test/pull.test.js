import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pullFromBuild } from "../src/sync/repo.js";

const KM = "config/lily58.keymap";
const git = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "pipe" });

// Monta um "remote" (repo com o keymap) + um clone (o buildRepo) limpo na base.
async function setup(destContent) {
  const root = await mkdtemp(join(tmpdir(), "zmk-pull-"));
  const remote = join(root, "remote");
  const clone = join(root, "buildclone");
  await mkdir(join(remote, "config"), { recursive: true });
  git(remote, "init", "-q", "-b", "base");
  git(remote, "config", "user.email", "t@t.t");
  git(remote, "config", "user.name", "t");
  await writeFile(join(remote, KM), destContent);
  git(remote, "add", "-A");
  git(remote, "commit", "-q", "-m", "init");
  execFileSync("git", ["clone", "-q", remote, clone], { stdio: "pipe" });
  git(clone, "config", "user.email", "t@t.t");
  git(clone, "config", "user.name", "t");
  const cfg = { path: clone, keymapDest: KM, baseBranch: "base", remote: "origin" };
  return { root, cfg };
}

test("pullFromBuild: cópia igual → changed:false", async () => {
  const { root, cfg } = await setup("CONTEUDO_V1\n");
  try {
    const local = join(root, "editor.keymap");
    await writeFile(local, "CONTEUDO_V1\n");
    const r = await pullFromBuild(cfg, local, {});
    assert.equal(r.ok, true);
    assert.equal(r.changed, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("pullFromBuild: diferente + adopt → cópia local vira a do repo", async () => {
  const { root, cfg } = await setup("REPO_V1\n");
  try {
    const local = join(root, "editor.keymap");
    await writeFile(local, "EDITOR_LOCAL\n");
    // sem adopt: reporta diferença sem sobrescrever
    const prev = await pullFromBuild(cfg, local, {});
    assert.equal(prev.changed, true);
    assert.equal(prev.adopted, false);
    assert.equal(await readFile(local, "utf8"), "EDITOR_LOCAL\n"); // intacto
    // com adopt: local passa a ser o do repo
    const ad = await pullFromBuild(cfg, local, { adopt: true });
    assert.equal(ad.adopted, true);
    assert.equal(await readFile(local, "utf8"), "REPO_V1\n");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("pullFromBuild: repo sujo → recusa, cópia local intacta", async () => {
  const { root, cfg } = await setup("REPO_V1\n");
  try {
    const local = join(root, "editor.keymap");
    await writeFile(local, "EDITOR_LOCAL\n");
    await writeFile(join(cfg.path, KM), "SUJO\n"); // suja o working tree do clone
    const r = await pullFromBuild(cfg, local, { adopt: true });
    assert.equal(r.ok, false);
    assert.equal(r.code, "dirty");
    assert.equal(await readFile(local, "utf8"), "EDITOR_LOCAL\n"); // não tocou na cópia
  } finally { await rm(root, { recursive: true, force: true }); }
});
