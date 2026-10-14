import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  listProfiles, validateProfile, createProfile, getActive, setActive,
  migrateLegacy, resolveActive, readGlobal,
} from "../src/profiles/profiles.js";

async function tmpRoot() {
  const root = await mkdtemp(join(tmpdir(), "zmk-prof-"));
  // layout dummy p/ createProfile validar existência
  await mkdir(join(root, "src", "layout"), { recursive: true });
  await writeFile(join(root, "src", "layout", "lily58.layout.json"), JSON.stringify({ keyCount: 58, rows: 5, keys: [] }));
  return root;
}

test("migrateLegacy: cria perfil a partir do config legado e é idempotente", async () => {
  const root = await tmpRoot();
  try {
    await writeFile(join(root, "config.json"), JSON.stringify({
      keymapPath: "keymaps/lily58.keymap", keyboard: "lily58",
      layout: "src/layout/lily58.layout.json", port: 5173,
      buildRepo: { path: "../zmk-config", keymapDest: "config/lily58.keymap", baseBranch: "main", remote: "origin" },
    }));
    const r1 = await migrateLegacy(root);
    assert.equal(r1.migrated, true);
    assert.equal(r1.name, "lily58");
    assert.ok(existsSync(join(root, "profiles", "lily58.json")));
    assert.equal(await getActive(root), "lily58");
    // config legado NÃO é apagado; só ganhou activeProfile
    const g = await readGlobal(root);
    assert.equal(g.activeProfile, "lily58");
    assert.equal(g.keymapPath, "keymaps/lily58.keymap");
    // idempotente
    const r2 = await migrateLegacy(root);
    assert.equal(r2.migrated, false);
    assert.equal((await listProfiles(root)).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("validateProfile: nome único/slug + campos obrigatórios", () => {
  assert.ok(!validateProfile({ name: "", keyboard: "k", layout: "l", keymapPath: "m" }).valid);
  assert.ok(!validateProfile({ name: "corne", keyboard: "corne", layout: "l", keymapPath: "m" }, ["corne"]).valid);
  assert.ok(!validateProfile({ name: "corne", layout: "l", keymapPath: "m" }).valid); // sem keyboard
  const v = validateProfile({ name: "Corne X", keyboard: "corne", layout: "l", keymapPath: "m" }, ["lily58"]);
  assert.ok(v.valid);
  assert.equal(v.name, "corne-x"); // slug
});

test("createProfile + setActive/getActive + resolveActive", async () => {
  const root = await tmpRoot();
  try {
    const r = await createProfile(root, {
      name: "lily58", keyboard: "lily58",
      layout: "src/layout/lily58.layout.json", keymapPath: "keymaps/lily58.keymap",
      buildRepo: null,
    });
    assert.ok(r.ok, JSON.stringify(r.errors));
    assert.ok(existsSync(join(root, "profiles", "lily58.json")));

    // layout inexistente é rejeitado
    const bad = await createProfile(root, { name: "x", keyboard: "x", layout: "nope.json", keymapPath: "k.keymap" });
    assert.ok(!bad.ok);

    await setActive(root, "lily58");
    assert.equal(await getActive(root), "lily58");

    const active = await resolveActive(root);
    assert.equal(active.name, "lily58");
    assert.ok(active.layoutPath.startsWith(root)); // path absoluto resolvido contra root
    assert.ok(active.keymapPath.endsWith("keymaps/lily58.keymap"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("resolveActive: fallback pro primeiro perfil quando o ativo não existe", async () => {
  const root = await tmpRoot();
  try {
    await createProfile(root, { name: "lily58", keyboard: "lily58", layout: "src/layout/lily58.layout.json", keymapPath: "keymaps/lily58.keymap" });
    await writeFile(join(root, "config.json"), JSON.stringify({ activeProfile: "inexistente", port: 5173 }));
    const active = await resolveActive(root);
    assert.equal(active.name, "lily58"); // caiu no primeiro
    assert.equal(await getActive(root), "lily58"); // e corrigiu o ativo
  } finally { await rm(root, { recursive: true, force: true }); }
});
