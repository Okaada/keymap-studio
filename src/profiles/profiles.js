// Perfis de teclado: cada perfil = { name, keyboard, layout, keymapPath, buildRepo } em
// profiles/<name>.json. config.json passa a ser o config GLOBAL { activeProfile, port }.
// I/O puro (recebe o diretório-base `root`), testável sem subir o servidor.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, isAbsolute, resolve } from "node:path";

export const slug = (s) =>
  String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

const globalPath = (root) => join(root, "config.json");
const profilesDir = (root) => join(root, "profiles");

export async function readGlobal(root) {
  try { return JSON.parse(await readFile(globalPath(root), "utf8")); } catch { return {}; }
}
export async function writeGlobal(root, obj) {
  await writeFile(globalPath(root), JSON.stringify(obj, null, 2) + "\n");
}

export async function listProfiles(root) {
  const dir = profilesDir(root);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of (await readdir(dir)).filter((f) => f.endsWith(".json"))) {
    try {
      const p = JSON.parse(await readFile(join(dir, f), "utf8"));
      out.push({ ...p, name: p.name || f.replace(/\.json$/, "") });
    } catch { /* ignora arquivo de perfil inválido */ }
  }
  return out;
}

export function validateProfile(p, existingNames = []) {
  const errors = [];
  const name = slug(p?.name);
  if (!name) errors.push("nome inválido (use letras, números, '-' ou '_')");
  else if (existingNames.map(slug).includes(name)) errors.push(`já existe um perfil "${name}"`);
  if (!p?.keyboard) errors.push("keyboard é obrigatório");
  if (!p?.layout) errors.push("layout é obrigatório");
  if (!p?.keymapPath) errors.push("keymapPath é obrigatório");
  return { valid: errors.length === 0, errors, name };
}

export async function createProfile(root, p) {
  const existing = (await listProfiles(root)).map((x) => x.name);
  const v = validateProfile(p, existing);
  if (!v.valid) return { ok: false, errors: v.errors };
  // layout precisa existir (resolvido contra root se relativo)
  const layoutAbs = isAbsolute(p.layout) ? p.layout : resolve(root, p.layout);
  if (!existsSync(layoutAbs)) return { ok: false, errors: [`layout não encontrado: ${p.layout}`] };
  await mkdir(profilesDir(root), { recursive: true });
  const profile = { name: v.name, keyboard: p.keyboard, layout: p.layout, keymapPath: p.keymapPath, buildRepo: p.buildRepo || null };
  await writeFile(join(profilesDir(root), `${v.name}.json`), JSON.stringify(profile, null, 2) + "\n");
  return { ok: true, profile };
}

export async function getActive(root) {
  return (await readGlobal(root)).activeProfile || null;
}
export async function setActive(root, name) {
  const g = await readGlobal(root);
  g.activeProfile = slug(name);
  await writeGlobal(root, g);
  return g.activeProfile;
}

// Migração do config legado (single-config) → um perfil. Idempotente: só roda quando não
// há nenhum perfil ainda e o config.json tem `keymapPath`. Não apaga o config legado.
export async function migrateLegacy(root) {
  if ((await listProfiles(root)).length) return { migrated: false };
  const g = await readGlobal(root);
  if (!g.keymapPath) return { migrated: false };
  const name = slug(g.keyboard || "default");
  const profile = { name, keyboard: g.keyboard || name, layout: g.layout, keymapPath: g.keymapPath, buildRepo: g.buildRepo || null };
  await mkdir(profilesDir(root), { recursive: true });
  await writeFile(join(profilesDir(root), `${name}.json`), JSON.stringify(profile, null, 2) + "\n");
  g.activeProfile = name;
  await writeGlobal(root, g);
  return { migrated: true, name, profile };
}

// Resolve o perfil ativo com paths absolutos (migra do legado se preciso).
export async function resolveActive(root) {
  await migrateLegacy(root);
  const all = await listProfiles(root);
  if (!all.length) throw new Error("Nenhum perfil configurado (crie profiles/<nome>.json ou um config.json legado).");
  let name = await getActive(root);
  let p = all.find((x) => slug(x.name) === slug(name));
  if (!p) { p = all[0]; await setActive(root, p.name); } // fallback pro primeiro
  const abs = (x) => (x && !isAbsolute(x) ? resolve(root, x) : x);
  return {
    name: p.name,
    keyboard: p.keyboard,
    layoutPath: abs(p.layout),
    keymapPath: abs(p.keymapPath),
    buildRepo: p.buildRepo || null,
  };
}
