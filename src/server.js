#!/usr/bin/env node
// Servidor local único (D3): serve a UI estática e expõe a API de IO/validação/export
// sobre o `.keymap` como fonte da verdade. localhost, usuário único, sem deps externas.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve, isAbsolute } from "node:path";

import { parseKeymap } from "./keymap/parser.js";
import { serializeKeymap, snapshotBindings, snapshotDisplayNames } from "./keymap/serializer.js";
import { validateKeymap, validateBehaviors, effectiveCatalog, FLAVOR_OPTIONS } from "./keymap/validate.js";
import { PARAM_OPTIONS, PARAM_TYPE_DESC } from "./keymap/catalog.js";
import { BEHAVIOR_TYPES, behaviorTypeOptions } from "./keymap/behaviorTypes.js";
import { applyIncoming } from "./keymap/apply.js";
import { diffText } from "./keymap/diff.js";
import { visualDiff } from "./keymap/visualDiff.js";
import { buildCheatsheet } from "./keymap/cheatsheet.js";
import { preview as syncPreview, sync as syncRun, pullFromBuild, resolveBuildRepo } from "./sync/repo.js";
import { buildStatus, buildLogFailed, listFirmware, findUf2 } from "./sync/build.js";
import * as profiles from "./profiles/profiles.js";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB = join(__dirname, "..", "web");
const CACHE = join(ROOT, ".cache");

// --- estado em memória: perfil ativo (layout/keymap/buildRepo) + modelo + snapshot ---
const state = { profile: null, layout: null, buildRepo: null, model: null, original: null, originalDN: null };

// Ativa um perfil (ou resolve o ativo), carregando layout + buildRepo + keymap.
async function activate(name) {
  if (name) await profiles.setActive(ROOT, name);
  const p = await profiles.resolveActive(ROOT); // migra do config legado se preciso
  // Override de teste: aponta o keymap para uma cópia sem mexer no perfil.
  if (process.env.ZMK_KEYMAP_PATH) p.keymapPath = process.env.ZMK_KEYMAP_PATH;
  state.profile = p;
  // Bootstrap: num clone novo, se o keymap do perfil ainda não existe mas há um
  // *.example.keymap ao lado, usa-o como ponto de partida (onboarding sem erro).
  if (!existsSync(p.keymapPath)) {
    const example = p.keymapPath.replace(/\.keymap$/, ".example.keymap");
    if (existsSync(example)) await writeFile(p.keymapPath, await readFile(example, "utf8"));
  }
  state.layout = JSON.parse(await readFile(p.layoutPath, "utf8"));
  state.buildRepo = p.buildRepo ? resolveBuildRepo(p.buildRepo, ROOT) : null;
  if (state.buildRepo && !existsSync(join(state.buildRepo.path, ".git"))) {
    console.warn(`⚠ buildRepo.path não parece um repo git: ${state.buildRepo.path} (sync desativado)`);
  }
  await loadModel();
  return p;
}

async function loadModel() {
  const text = await readFile(state.profile.keymapPath, "utf8");
  state.model = parseKeymap(text);
  state.original = snapshotBindings(state.model);
  state.originalDN = snapshotDisplayNames(state.model);
  return state.model;
}

function modelPayload() {
  const m = state.model;
  return {
    keymapPath: state.profile.keymapPath,
    profile: { name: state.profile.name, keyboard: state.profile.keyboard },
    layout: state.layout,
    catalog: effectiveCatalog(m.customBehaviors),
    paramOptions: PARAM_OPTIONS,
    flavorOptions: FLAVOR_OPTIONS,
    behaviorTypes: BEHAVIOR_TYPES,
    behaviorTypeOptions: behaviorTypeOptions(),
    paramTypeDesc: PARAM_TYPE_DESC,
    behaviors: m.behaviors.map((b) => ({ ref: b.ref, compatible: b.compatible, isHoldTap: b.isHoldTap, config: b.config })),
    layers: m.layers.map((l) => ({
      name: l.name,
      displayName: l.displayName,
      bindings: l.bindings,
    })),
    validation: validateKeymap(m, state.layout.keyCount),
  };
}

// --- helpers HTTP ---
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

async function serveStatic(res, file) {
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "content-type": (MIME[extname(file)] || "application/octet-stream") + "; charset=utf-8" });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

// --- API ---
async function handleApi(req, res, url) {
  // Ler modelo atual
  if (req.method === "GET" && url.pathname === "/api/keymap") {
    if (!state.model) await activate();
    return sendJson(res, 200, modelPayload());
  }

  // Listar perfis (+ qual é o ativo)
  if (req.method === "GET" && url.pathname === "/api/profiles") {
    if (!state.model) await activate();
    const list = (await profiles.listProfiles(ROOT)).map((p) => ({ name: p.name, keyboard: p.keyboard }));
    return sendJson(res, 200, { active: state.profile.name, profiles: list });
  }

  // Selecionar o perfil ativo → recarrega layout/keymap/behaviors/build
  if (req.method === "POST" && url.pathname === "/api/profiles/select") {
    const { name } = JSON.parse((await readBody(req)) || "{}");
    try {
      await activate(name);
      return sendJson(res, 200, { ok: true, ...modelPayload() });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // Criar um novo perfil (valida; bootstrap do keymap via example se faltar)
  if (req.method === "POST" && url.pathname === "/api/profiles") {
    const p = JSON.parse((await readBody(req)) || "{}");
    const r = await profiles.createProfile(ROOT, p);
    if (!r.ok) return sendJson(res, 400, { ok: false, errors: r.errors });
    // bootstrap: se o keymap do perfil não existir mas houver um *.example.keymap, copia.
    const kmAbs = isAbsolute(r.profile.keymapPath) ? r.profile.keymapPath : resolve(ROOT, r.profile.keymapPath);
    if (!existsSync(kmAbs)) {
      const example = kmAbs.replace(/\.keymap$/, ".example.keymap");
      if (existsSync(example)) await writeFile(kmAbs, await readFile(example, "utf8"));
    }
    await activate(r.profile.name);
    return sendJson(res, 200, { ok: true, ...modelPayload() });
  }

  // Recarregar do disco (reflete edições feitas pelo agente)
  if (req.method === "POST" && url.pathname === "/api/reload") {
    await loadModel();
    return sendJson(res, 200, modelPayload());
  }

  // Salvar edições (round-trip)
  if (req.method === "POST" && url.pathname === "/api/keymap") {
    if (!state.model) await activate();
    const incoming = JSON.parse(await readBody(req));
    const { newBehaviorErrors } = applyIncoming(state.model, incoming);
    const validation = validateKeymap(state.model, state.layout.keyCount);
    const behaviorValidation = validateBehaviors(state.model);
    if (!validation.valid || !behaviorValidation.valid || newBehaviorErrors.length) {
      state.model.newBehaviors = []; // descarta tentativa inválida
      return sendJson(res, 400, { ok: false, validation, behaviorValidation, newBehaviorErrors });
    }
    const text = serializeKeymap(state.model, state.original, state.layout.rows, state.originalDN);
    await writeFile(state.profile.keymapPath, text);
    await loadModel(); // reset baseline a partir do arquivo salvo
    return sendJson(res, 200, { ok: true, validation, ...modelPayload() });
  }

  // Dry-run do save: aplica o payload numa CÓPIA do modelo, valida e devolve o diff
  // (arquivo salvo atual × serialização pendente). Nunca grava nem muta state.model.
  if (req.method === "POST" && url.pathname === "/api/keymap/preview") {
    if (!state.model) await activate();
    const incoming = JSON.parse(await readBody(req));
    const draft = structuredClone(state.model);
    const { newBehaviorErrors } = applyIncoming(draft, incoming);
    const validation = validateKeymap(draft, state.layout.keyCount);
    const behaviorValidation = validateBehaviors(draft);
    if (!validation.valid || !behaviorValidation.valid || newBehaviorErrors.length) {
      return sendJson(res, 200, { ok: false, changed: false, diff: "", validation, behaviorValidation, newBehaviorErrors });
    }
    const pending = serializeKeymap(draft, state.original, state.layout.rows, state.originalDN);
    const current = await readFile(state.profile.keymapPath, "utf8");
    const { changed, diff } = await diffText(current, pending, { labelA: "atual", labelB: "pendente" });
    const visual = visualDiff({
      layersBefore: state.model.layers,
      layersAfter: draft.layers,
      dnBefore: state.model.layers.map((l) => l.displayName ?? null),
      dnAfter: draft.layers.map((l) => l.displayName ?? null),
      behaviorsBefore: state.model.behaviors,
      behaviorsAfter: draft.behaviors,
    });
    return sendJson(res, 200, { ok: true, changed, diff, visual, validation, behaviorValidation, newBehaviorErrors });
  }

  // Gerar cheatsheet (SVG + PDF)
  if (req.method === "POST" && url.pathname === "/api/cheatsheet") {
    try {
      const r = await buildCheatsheet(state.profile.keymapPath, CACHE, state.profile.keyboard || "lily58");
      return sendJson(res, 200, {
        ok: true,
        svg: r.svg,
        pdf: r.pdfPath ? "/api/cheatsheet.pdf" : null,
        warning: r.warning,
      });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message, stderr: e.stderr || null });
    }
  }

  // Preview do sync (read-only — nunca muta o repo de build)
  if (req.method === "GET" && url.pathname === "/api/sync/preview") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado no perfil ativo." });
    try {
      const r = await syncPreview(state.buildRepo, state.profile.keymapPath);
      return sendJson(res, 200, { ok: true, ...r });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  // Executar o sync: branch + commit + push + PR (ação externa, sob confirmação da UI)
  if (req.method === "POST" && url.pathname === "/api/sync") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado no perfil ativo." });
    const body = JSON.parse((await readBody(req)) || "{}");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    try {
      const r = await syncRun(state.buildRepo, state.profile.keymapPath, { message: body.message, stamp });
      if (!r.ok && ["dirty", "wrong-branch", "no-change"].includes(r.code)) {
        return sendJson(res, 409, r);
      }
      return sendJson(res, r.ok ? 200 : 500, r);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  // Puxar/reconciliar o keymap do repo de build (build→editor). adopt → sobrescreve a cópia local.
  if (req.method === "POST" && url.pathname === "/api/build/pull") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado no perfil ativo." });
    const { adopt } = JSON.parse((await readBody(req)) || "{}");
    const r = await pullFromBuild(state.buildRepo, state.profile.keymapPath, { adopt: !!adopt });
    if (r.ok && r.adopted) { await loadModel(); return sendJson(res, 200, { ...r, ...modelPayload() }); }
    return sendJson(res, r.ok ? 200 : 409, r);
  }

  // --- Acompanhamento do build remoto (CI do buildRepo do perfil ativo) ---
  const firmwareDir = (run) => join(CACHE, "firmware", String(run).replace(/[^\w.-]/g, "_"));

  if (req.method === "GET" && url.pathname === "/api/build/status") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado no perfil ativo." });
    const branch = url.searchParams.get("branch");
    if (!branch) return sendJson(res, 400, { ok: false, error: "parâmetro 'branch' obrigatório." });
    return sendJson(res, 200, { ok: true, ...(await buildStatus(state.buildRepo, branch)) });
  }

  if (req.method === "GET" && url.pathname === "/api/build/log") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado." });
    const run = url.searchParams.get("run");
    if (!run) return sendJson(res, 400, { ok: false, error: "parâmetro 'run' obrigatório." });
    return sendJson(res, 200, { ok: true, log: await buildLogFailed(state.buildRepo, run) });
  }

  if (req.method === "GET" && url.pathname === "/api/build/firmware") {
    if (!state.buildRepo) return sendJson(res, 400, { ok: false, error: "buildRepo não configurado." });
    const run = url.searchParams.get("run");
    if (!run) return sendJson(res, 400, { ok: false, error: "parâmetro 'run' obrigatório." });
    const files = await listFirmware(state.buildRepo, run, firmwareDir(run));
    return sendJson(res, 200, { ok: true, files: files.map((f) => f.name) });
  }

  if (req.method === "GET" && url.pathname === "/api/build/firmware/download") {
    const run = url.searchParams.get("run");
    const name = url.searchParams.get("name");
    if (!run || !name) { res.writeHead(400); return res.end("parâmetros 'run' e 'name' obrigatórios."); }
    // Casa pelo nome contra os arquivos realmente baixados (evita path traversal).
    const f = (await findUf2(firmwareDir(run))).find((x) => x.name === name);
    if (!f) { res.writeHead(404); return res.end("artefato não encontrado (liste o firmware primeiro)."); }
    try {
      const buf = await readFile(f.path);
      res.writeHead(200, { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${name}"` });
      return res.end(buf);
    } catch { res.writeHead(404); return res.end("falha ao ler o artefato."); }
  }

  // Baixar o último PDF gerado
  if (req.method === "GET" && url.pathname === "/api/cheatsheet.pdf") {
    try {
      const buf = await readFile(join(CACHE, "cheatsheet.pdf"));
      res.writeHead(200, { "content-type": "application/pdf", "content-disposition": "inline; filename=lily58-cheatsheet.pdf" });
      return res.end(buf);
    } catch {
      res.writeHead(404);
      return res.end("Gere o cheatsheet primeiro.");
    }
  }

  sendJson(res, 404, { error: "rota desconhecida" });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);

    if (url.pathname === "/" || url.pathname === "/index.html") return serveStatic(res, join(WEB, "index.html"));
    if (url.pathname === "/app.js") return serveStatic(res, join(WEB, "app.js"));
    if (url.pathname === "/style.css") return serveStatic(res, join(WEB, "style.css"));

    res.writeHead(404);
    res.end("Not found");
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

// Ativa o perfil (migra do config legado se preciso) antes de servir.
await activate();
const port = (await profiles.readGlobal(ROOT)).port || 5173;
server.listen(port, "127.0.0.1", () => {
  console.log(`ZMK Visual Configurator → http://127.0.0.1:${port}`);
  console.log(`Perfil ativo: ${state.profile.name} · keymap: ${state.profile.keymapPath}`);
});
