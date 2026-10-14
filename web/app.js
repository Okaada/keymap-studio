// Frontend do configurador visual (vanilla ES modules).
const SCALE = 1.0;
const KEY_GAP = 6; // espaçamento visual entre teclas (tecla desenhada menor que a célula)

const state = {
  data: null,
  active: 0,
  selected: null,
  tester: false,
  pressed: new Set(), // posições atualmente pressionadas (tester)
  metrics: null,
};

const $ = (sel) => document.querySelector(sel);

// Rótulos curtos/glyphs para keycodes longos (evita quebra; binding completo fica no tooltip).
const KEY_LABELS = {
  LEFT_SHIFT: "⇧", RSHFT: "⇧", RIGHT_SHIFT: "⇧", LSHFT: "⇧",
  LEFT_CONTROL: "⌃", LCTRL: "⌃", RCTRL: "⌃", RIGHT_CONTROL: "⌃",
  LEFT_ALT: "⌥", RIGHT_ALT: "⌥", RALT: "⌥", LALT: "⌥",
  LEFT_COMMAND: "⌘", LEFT_GUI: "⌘", RIGHT_GUI: "⌘", RGUI: "⌘", RCMD: "⌘", LGUI: "⌘", GLOBE: "🌐",
  BACKSPACE: "⌫", DELETE: "⌦", RET: "⏎", RETURN: "⏎", ENTER: "⏎", ESC: "esc", ESCAPE: "esc",
  SPACE: "␣", TAB: "⇥", CAPSLOCK: "⇪", CAPS: "⇪",
  LEFT: "←", RIGHT: "→", UP: "↑", DOWN: "↓", LEFT_ARROW: "←", RIGHT_ARROW: "→", UP_ARROW: "↑", DOWN_ARROW: "↓",
  HOME: "↖", END: "↘", GRAVE: "`", MINUS: "-", EQUAL: "=", UNDER: "_",
  LEFT_BRACKET: "[", RIGHT_BRACKET: "]", LBKT: "[", RBKT: "]", LBRC: "{", RBRC: "}",
  SEMI: ";", SEMICOLON: ";", SQT: "'", APOS: "'", COMMA: ",", DOT: ".", FSLH: "/", SLASH: "/", BSLH: "\\", BACKSLASH: "\\",
  KP_PLUS: "+", PLUS: "+", C_VOL_UP: "🔊", C_VOL_DN: "🔉",
};

function prettyKey(tok) {
  if (tok == null) return "";
  if (KEY_LABELS[tok]) return KEY_LABELS[tok];
  if (/^N[0-9]$/.test(tok)) return tok.slice(1); // N1 → 1
  if (/^F[0-9]{1,2}$/.test(tok)) return tok; // F1..F12
  return tok;
}

async function api(path, opts) {
  const res = await fetch(path, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function load() {
  const { json } = await api("/api/keymap");
  state.data = json;
  state.selected = null;
  await refreshProfiles();
  render();
}

// ---- perfis ----
async function refreshProfiles() {
  const { json } = await api("/api/profiles");
  const sel = $("#profile-select");
  sel.innerHTML = (json.profiles || [])
    .map((p) => `<option value="${escapeHtml(p.name)}" ${p.name === json.active ? "selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(p.keyboard)})</option>`)
    .join("");
  $("#profile-sub").textContent = "— " + (state.data?.profile?.keyboard || json.active || "");
}

async function selectProfile(name) {
  const { ok, json } = await api("/api/profiles/select", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }),
  });
  if (ok) {
    state.data = json; state.active = 0; state.selected = null;
    await refreshProfiles(); render(); flash("Perfil ativo: " + name);
  } else flash("Falha ao trocar de perfil: " + (json.error || ""), true);
}

function openNewProfile() {
  $("#profile-errors").textContent = "";
  $("#profile-dialog").showModal();
}

async function createProfile() {
  const body = {
    name: $("#np-name").value.trim(),
    keyboard: $("#np-keyboard").value.trim(),
    layout: $("#np-layout").value.trim(),
    keymapPath: $("#np-keymap").value.trim(),
  };
  const repo = $("#np-repo").value.trim();
  if (repo) body.buildRepo = { path: repo, keymapDest: $("#np-dest").value.trim(), baseBranch: $("#np-base").value.trim() || "main", remote: "origin" };
  const { ok, json } = await api("/api/profiles", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  if (ok) {
    state.data = json; state.active = 0; state.selected = null;
    await refreshProfiles(); render(); $("#profile-dialog").close(); flash("Perfil criado: " + body.name);
  } else {
    $("#profile-errors").innerHTML = "⚠ " + (json.errors || [json.error || "falhou"]).map(escapeHtml).join("<br>");
  }
}

// ---- formatação de legenda da tecla ----
function behaviorEntry(ref) {
  return state.data.catalog.find((b) => b.ref === ref) || null;
}

function legend(b) {
  if (b.ref === "trans") return { tap: "▽", cls: "trans" };
  if (b.ref === "none") return { tap: "∅", cls: "none" };
  const entry = behaviorEntry(b.ref);
  const p = b.params;
  if (!p.length) return { tap: prettyKey(b.ref) };
  // 2 params com hold (mod/layer) + tap → tap em cima, hold embaixo
  const twoHold = entry && entry.params.length >= 2 && ["mod", "layer", "raw"].includes(entry.params[0].type);
  if (p.length >= 2 && (twoHold || !entry)) {
    const hold = entry && entry.params[0].type === "layer" ? `L${p[0]}` : prettyKey(p[0]);
    return { tap: prettyKey(p[1]), hold };
  }
  // 1 param de layer → "→Ln"
  if (entry && entry.params[0] && entry.params[0].type === "layer") {
    return { tap: `→L${p[0]}`, hold: b.ref };
  }
  return { tap: p.map(prettyKey).join(" "), hold: entry ? b.ref : undefined };
}

// ---- render ----
function renderLayers() {
  const el = $("#layers");
  el.innerHTML = "";
  state.data.layers.forEach((l, i) => {
    const b = document.createElement("button");
    b.textContent = l.displayName || l.name;
    b.className = i === state.active ? "active" : "";
    b.title = "Clique para abrir · duplo-clique para renomear";
    // Single-click troca de layer SEM reconstruir a barra (senão o alvo do dblclick some).
    b.onclick = () => selectLayer(i);
    b.ondblclick = () => startRename(i, el, b);
    el.appendChild(b);
  });
}

function selectLayer(i) {
  state.active = i;
  state.selected = null;
  if (state.tester) refreshKpIndex(); // tester mapeia contra a layer selecionada
  [...$("#layers").children].forEach((btn, idx) => btn.classList.toggle("active", idx === i));
  renderBoard();
  renderPalette();
}

// Renomear layer por duplo-clique na aba (D6): vira campo editável; Enter salva.
function startRename(i, el, btn) {
  const layer = state.data.layers[i];
  const input = document.createElement("input");
  input.value = layer.displayName || layer.name;
  input.setAttribute("aria-label", "Novo nome da layer");
  el.replaceChild(input, btn);
  input.focus();
  input.select();
  let done = false;
  const commit = async (save) => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (save && name && name !== (layer.displayName || layer.name)) {
      layer.displayName = name;
      await persistRename();
    } else {
      render();
    }
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") commit(true);
    else if (e.key === "Escape") commit(false);
  };
  input.onblur = () => commit(true);
}

async function persistRename() {
  const { ok, json } = await api("/api/keymap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ layers: state.data.layers }),
  });
  if (ok) {
    state.data = json;
    render();
    flash("💾 Layer renomeada e salva.");
  } else {
    render();
    flash("Não salvo: " + (json.validation ? "corrija os erros." : "falhou."), true);
  }
}

// Geometria de uma tecla (posicionamento por layout) — compartilhada pelo board do
// editor e pelo board de diff. Célula centrada em (x,y); tecla menor (KEY_GAP) p/ espaço.
function keyStyle(div, k) {
  div.style.left = (k.x - k.w / 2) * SCALE + KEY_GAP / 2 + "px";
  div.style.top = (k.y - k.h / 2) * SCALE + KEY_GAP / 2 + "px";
  div.style.width = k.w * SCALE - KEY_GAP + "px";
  div.style.height = k.h * SCALE - KEY_GAP + "px";
  if (k.r) div.style.transform = `rotate(${k.r}deg)`;
}

function boardSize(el) {
  const vb = state.data.layout.viewBox;
  el.style.width = vb.w * SCALE + "px";
  el.style.height = vb.h * SCALE + "px";
}

function renderBoard() {
  const board = $("#board");
  boardSize(board);
  board.className = "board" + (state.tester ? " tester" : "");
  board.innerHTML = "";

  const layer = state.data.layers[state.active];
  state.data.layout.keys.forEach((k, pos) => {
    const b = layer.bindings[pos] || { ref: "none", params: [] };
    const div = document.createElement("div");
    const leg = legend(b);
    const cls = ["key"];
    if (leg.cls) cls.push(leg.cls);
    if (!state.tester && state.selected === pos) cls.push("selected");
    if (state.tester && state.pressed.has(pos)) cls.push("pressed");
    div.className = cls.join(" ");
    keyStyle(div, k);
    div.innerHTML =
      `<span class="tap">${escapeHtml(leg.tap)}</span>` +
      (leg.hold ? `<span class="hold">${escapeHtml(leg.hold)}</span>` : "");
    div.title = `pos ${pos}: &${b.ref} ${b.params.join(" ")}`.trim();
    if (!state.tester) {
      div.onclick = () => {
        state.selected = pos;
        render();
      };
    }
    board.appendChild(div);
  });
}

function renderPalette() {
  const el = $("#palette");
  if (state.tester) return renderTesterPanel(el);
  if (state.selected == null) {
    el.innerHTML = '<p class="palette-empty">Selecione uma tecla para ver as funções disponíveis.</p>';
    return;
  }
  const pos = state.selected;
  const layer = state.data.layers[state.active];
  const cur = layer.bindings[pos] || { ref: "none", params: [] };

  const options = state.data.catalog
    .map((b) => `<option value="${b.ref}" ${b.ref === cur.ref ? "selected" : ""}>&${b.ref} — ${escapeHtml(b.label)}</option>`)
    .join("");

  // Resumo + link quando a tecla usa um behavior configurável (hold-tap).
  const confBeh = (state.data.behaviors || []).find((b) => b.ref === cur.ref && b.isHoldTap);
  const confHtml = confBeh
    ? `<p class="beh-link">⚙️ <strong>&${escapeHtml(cur.ref)}</strong>: ${escapeHtml(behaviorSummary(confBeh))} · <a id="open-beh">configurar</a></p>`
    : "";

  el.innerHTML = `
    <h2>Editar tecla</h2>
    <p class="pos">Layer <strong>${escapeHtml(layer.displayName || layer.name)}</strong> · posição ${pos}</p>
    <label>Função / behavior</label>
    <select id="beh">${options}</select>
    <div id="params"></div>
    ${confHtml}
    <button class="apply primary" id="apply">Aplicar à tecla</button>
  `;
  $("#beh").onchange = () => renderParams($("#beh").value, []);
  renderParams(cur.ref, cur.params);
  $("#apply").onclick = applyBehavior;
  if (confBeh) $("#open-beh").onclick = openBehaviors;
}

function renderParams(ref, values) {
  const entry = behaviorEntry(ref);
  const host = $("#params");
  const descHtml = entry && entry.desc ? `<p class="hint-desc">${escapeHtml(entry.desc)}</p>` : "";
  if (!entry || !entry.params.length) {
    host.innerHTML = descHtml || (entry ? "" : '<p class="pos">Behavior fora do catálogo: parâmetros livres.</p>');
    host.dataset.kind = "none";
    return;
  }
  const opts = state.data.paramOptions || {};
  const layers = state.data.layers;
  host.innerHTML = descHtml + entry.params
    .map((p, i) => {
      const v = values[i] ?? "";
      let field;
      if (p.type === "layer") {
        field = `<select data-i="${i}">${layers
          .map((l, li) => `<option value="${li}" ${String(li) === String(v) ? "selected" : ""}>${li} — ${escapeHtml(l.displayName || l.name)}</option>`)
          .join("")}</select>`;
      } else if (opts[p.type]) {
        field = `<select data-i="${i}">${opts[p.type]
          .map((o) => `<option value="${o}" ${o === v ? "selected" : ""}>${o}</option>`)
          .join("")}</select>`;
      } else {
        field = `<input data-i="${i}" value="${escapeHtml(v)}" placeholder="${escapeHtml(p.name)}" />`;
      }
      const desc = p.desc || (state.data.paramTypeDesc || {})[p.type] || "";
      const hint = desc ? ` <span class="hint-desc">${escapeHtml(desc)}</span>` : "";
      return `<label>${escapeHtml(p.name)}${hint}</label>${field}`;
    })
    .join("");
  host.dataset.kind = "fields";
}

function applyBehavior() {
  const ref = $("#beh").value;
  const entry = behaviorEntry(ref);
  let params = [];
  const host = $("#params");
  if (entry && entry.params.length) {
    params = [...host.querySelectorAll("[data-i]")]
      .sort((a, b) => a.dataset.i - b.dataset.i)
      .map((f) => f.value.trim())
      .filter((v, i) => v !== "" || i < (entry.min ?? entry.params.length));
  } else if (!entry) {
    // behavior fora do catálogo: mantém params atuais
    params = state.data.layers[state.active].bindings[state.selected].params;
  }
  state.data.layers[state.active].bindings[state.selected] = { ref, params };
  render();
}

function render() {
  renderLayers();
  renderBoard();
  renderPalette();
  showValidation(state.data.validation);
}

function showValidation(v) {
  const el = $("#validation");
  if (!v) return el.classList.add("hidden");
  el.classList.remove("hidden");
  if (v.valid) {
    el.className = "validation ok";
    el.textContent = "✓ Keymap válido.";
  } else {
    el.className = "validation err";
    el.innerHTML = `⚠ ${v.errors.length} problema(s):<ul>${v.errors.map((e) => `<li>${escapeHtml(e.message)}</li>`).join("")}</ul>`;
  }
}

// ---- ações ----
async function save() {
  const { ok, json } = await api("/api/keymap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ layers: state.data.layers }),
  });
  if (ok) {
    state.data = json;
    render();
    flash("💾 Salvo no .keymap.");
  } else {
    showValidation(json.validation);
    flash("Não salvo: corrija os erros.", true);
  }
}

async function reload() {
  await load();
  flash("↻ Recarregado do disco.");
}

// ---- puxar do repo de build (reconciliação; repo é a fonte da verdade após merge) ----
async function pullFromBuildUI() {
  const { json } = await api("/api/build/pull", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{}",
  });
  if (!json.ok) return flash("Puxar do build falhou: " + (json.message || json.error || ""), true);
  if (!json.changed) return flash("⬇ Já está igual ao repo de build.");
  const visual = json.visual || { layers: [], behaviors: [], renames: [] };
  state.pull = {
    view: "visual",
    ctx: {
      visual,
      afterLayers: visual.afterLayers || [],
      active: visual.layers[0]?.index ?? 0,
      els: { layersSel: $("#pull-layers"), board: $("#pull-board"), footer: $("#pull-footer") },
    },
  };
  $("#pull-diff").textContent = json.diff || "";
  $("#pull-dialog").showModal();
  setPullView("visual");
}

function setPullView(view) {
  state.pull.view = view;
  $("#pull-visual-btn").classList.toggle("active", view === "visual");
  $("#pull-text-btn").classList.toggle("active", view === "text");
  $("#pull-visual").classList.toggle("hidden", view !== "visual");
  $("#pull-diff").classList.toggle("hidden", view !== "text");
  $("#pull-layers").style.visibility = view === "visual" ? "visible" : "hidden";
  if (view === "visual") renderVisualDiff(state.pull.ctx);
}

async function adoptFromBuild() {
  const { json } = await api("/api/build/pull", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ adopt: true }),
  });
  if (json.ok && json.adopted) {
    state.data = json; state.active = 0; state.selected = null;
    render(); $("#pull-dialog").close(); flash("⬇ Adotado do repo de build.");
  } else flash("Adoção falhou: " + (json.message || json.error || ""), true);
}

// Pré-visualiza (dry-run) o que o Salvar gravaria: diff visual (board) + textual, sem gravar.
async function openPreview() {
  const dlg = $("#preview-dialog");
  $("#preview-toolbar").classList.add("hidden");
  $("#preview-visual").classList.add("hidden");
  $("#preview-diff").classList.add("hidden");
  $("#preview-errors").textContent = "";
  $("#preview-footer").innerHTML = "";
  $("#preview-status").classList.remove("hidden");
  $("#preview-status").textContent = "Calculando diff…";
  $("#preview-save").disabled = true;
  dlg.showModal();

  const { json } = await api("/api/keymap/preview", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ layers: state.data.layers }),
  });
  if (!json.ok) {
    const errs = [...(json.newBehaviorErrors || []), ...(json.behaviorValidation?.errors || []), ...(json.validation?.errors || [])];
    $("#preview-status").textContent = "⚠ Edição inválida — corrija antes de salvar:";
    $("#preview-errors").innerHTML = errs.map((e) => `• ${escapeHtml(e.message)}`).join("<br>");
    return;
  }
  if (!json.changed) {
    $("#preview-status").textContent = "Nenhuma mudança pendente em relação ao arquivo salvo.";
    return;
  }

  const visual = json.visual || { layers: [], behaviors: [], renames: [] };
  state.preview = {
    view: "visual",
    ctx: {
      visual,
      afterLayers: state.data.layers,
      active: visual.layers[0]?.index ?? state.active,
      els: { layersSel: $("#preview-layers"), board: $("#preview-board"), footer: $("#preview-footer") },
    },
  };
  $("#preview-status").classList.add("hidden");
  $("#preview-toolbar").classList.remove("hidden");
  $("#preview-diff").textContent = json.diff || "";
  $("#preview-save").disabled = false;
  setPreviewView("visual");
}

function setPreviewView(view) {
  state.preview.view = view;
  $("#pv-visual").classList.toggle("active", view === "visual");
  $("#pv-text").classList.toggle("active", view === "text");
  $("#preview-visual").classList.toggle("hidden", view !== "visual");
  $("#preview-diff").classList.toggle("hidden", view !== "text");
  $("#preview-layers").style.visibility = view === "visual" ? "visible" : "hidden";
  if (view === "visual") renderVisualDiff(state.preview.ctx);
}

// --- componente de diff visual reutilizável (preview do editor + preview do sync) ---
// ctx = { visual, afterLayers, els:{layersSel, board, footer}, active }
function renderVisualDiff(ctx) {
  const byIndex = new Map(ctx.visual.layers.map((l) => [l.index, l]));
  const sel = ctx.els.layersSel;
  sel.innerHTML = "";
  ctx.afterLayers.forEach((l, i) => {
    const n = byIndex.get(i)?.changes.length || 0;
    const b = document.createElement("button");
    b.innerHTML = `${escapeHtml(l.displayName || l.name)}${n ? ` <span class="pv-badge">${n}</span>` : ""}`;
    b.className = i === ctx.active ? "active" : "";
    if (!n) b.classList.add("pv-empty");
    b.onclick = () => { ctx.active = i; renderVisualDiff(ctx); };
    sel.appendChild(b);
  });
  drawVisualBoard(ctx.els.board, ctx.afterLayers[ctx.active], byIndex.get(ctx.active));
  renderVisualFooter(ctx.els.footer, ctx.visual);
}

function drawVisualBoard(board, layer, layerDiff) {
  boardSize(board);
  board.className = "board pv-board";
  board.innerHTML = "";
  const changeByPos = new Map((layerDiff?.changes || []).map((c) => [c.pos, c]));
  state.data.layout.keys.forEach((k, pos) => {
    const b = (layer && layer.bindings[pos]) || { ref: "none", params: [] };
    const div = document.createElement("div");
    const leg = legend(b);
    const cls = ["key"];
    if (leg.cls) cls.push(leg.cls);
    const ch = changeByPos.get(pos);
    if (ch) cls.push("diff-" + ch.kind);
    div.className = cls.join(" ");
    keyStyle(div, k);
    div.innerHTML =
      `<span class="tap">${escapeHtml(leg.tap)}</span>` +
      (leg.hold ? `<span class="hold">${escapeHtml(leg.hold)}</span>` : "");
    div.title = ch ? `pos ${pos}: ${ch.before || "∅"} → ${ch.after || "∅"}` : `pos ${pos}: &${b.ref} ${b.params.join(" ")}`.trim();
    board.appendChild(div);
  });
}

function renderVisualFooter(el, v) {
  const parts = [];
  if (v.behaviors.length) {
    parts.push("<strong>Behaviors:</strong> " + v.behaviors
      .map((x) => `&${escapeHtml(x.ref)}.${escapeHtml(x.prop)}: ${escapeHtml(String(x.before))} → ${escapeHtml(String(x.after))}`).join(" · "));
  }
  if (v.renames.length) {
    parts.push("<strong>Renomeações:</strong> " + v.renames
      .map((r) => `L${r.index}: ${escapeHtml(String(r.before ?? "—"))} → ${escapeHtml(String(r.after ?? "—"))}`).join(" · "));
  }
  el.innerHTML = parts.length ? `<p class="pos">${parts.join("<br>")}</p>` : "";
}

async function cheatsheet() {
  flash("Gerando cheatsheet…");
  const { ok, json } = await api("/api/cheatsheet", { method: "POST" });
  if (!ok) return flash("Erro no cheatsheet: " + (json.error || ""), true);
  $("#cheatsheet-body").innerHTML = json.svg;
  $("#pdf-link").style.display = json.pdf ? "inline" : "none";
  $("#cheatsheet-dialog").showModal();
  if (json.warning) flash(json.warning, true);
}

async function openSync() {
  const dlg = $("#sync-dialog");
  $("#sync-toolbar").classList.add("hidden");
  $("#sync-visual").classList.add("hidden");
  $("#sync-diff").classList.add("hidden");
  $("#sync-result").textContent = "";
  $("#sync-footer").innerHTML = "";
  $("#sync-status").classList.remove("hidden");
  $("#sync-status").textContent = "Calculando diff…";
  $("#sync-confirm").disabled = true;
  dlg.showModal();

  const { ok, json } = await api("/api/sync/preview");
  if (!ok) {
    $("#sync-status").textContent = "Erro: " + (json.error || "preview falhou");
    return;
  }
  if (!json.changed) {
    $("#sync-status").textContent = "Nada a sincronizar: o keymap local é idêntico ao do repo de build.";
    return;
  }
  $("#sync-diff").textContent = json.diff;
  $("#sync-confirm").disabled = false;

  if (json.visual) {
    state.sync = {
      view: "visual",
      ctx: {
        visual: json.visual,
        afterLayers: json.visual.afterLayers || [],
        active: json.visual.layers[0]?.index ?? 0,
        els: { layersSel: $("#sync-layers"), board: $("#sync-board"), footer: $("#sync-footer") },
      },
    };
    $("#sync-status").classList.add("hidden");
    $("#sync-toolbar").classList.remove("hidden");
    setSyncView("visual");
  } else {
    // degradação (destino ausente / parse falho): só o diff textual.
    state.sync = null;
    $("#sync-status").textContent = "Mudanças a enviar (local → repo de build):";
    $("#sync-diff").classList.remove("hidden");
  }
}

function setSyncView(view) {
  state.sync.view = view;
  $("#sync-visual-btn").classList.toggle("active", view === "visual");
  $("#sync-text-btn").classList.toggle("active", view === "text");
  $("#sync-visual").classList.toggle("hidden", view !== "visual");
  $("#sync-diff").classList.toggle("hidden", view !== "text");
  $("#sync-layers").style.visibility = view === "visual" ? "visible" : "hidden";
  if (view === "visual") renderVisualDiff(state.sync.ctx);
}

async function confirmSync() {
  $("#sync-confirm").disabled = true;
  $("#sync-result").textContent = "Criando branch, commit, push e PR…";
  const { ok, json } = await api("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: $("#sync-msg").value.trim() }),
  });
  const r = $("#sync-result");
  if (ok && json.ok) {
    const link = json.prUrl || json.compareUrl;
    r.innerHTML = `✓ Branch <code>${escapeHtml(json.branch)}</code> enviada. ` +
      (link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener">${json.prUrl ? "Abrir PR" : "Abrir PR (compare)"}</a>` : "") +
      (json.warning ? `<br><span class="pos">${escapeHtml(json.warning)}</span>` : "");
    if (json.branch) monitorBuild(json.branch);
  } else {
    r.textContent = "⚠ " + (json.message || json.error || "falhou");
    $("#sync-confirm").disabled = false;
  }
}

// ---- acompanhamento do build remoto (CI) ----
async function monitorBuild(branch) {
  const area = $("#build-area");
  area.classList.remove("hidden");
  area.innerHTML = `<p class="pos">⏳ Aguardando o build de <code>${escapeHtml(branch)}</code>…</p>`;
  let tries = 0;
  const poll = async () => {
    tries++;
    const { json } = await api(`/api/build/status?branch=${encodeURIComponent(branch)}`);
    if (!json.ok) return void (area.innerHTML = `<p class="pos">Build: ${escapeHtml(json.error || "indisponível")}</p>`);
    const runLink = json.url ? ` · <a href="${escapeHtml(json.url)}" target="_blank" rel="noopener">ver run</a>` : "";
    if (json.none || json.status !== "completed") {
      area.innerHTML = `<p class="pos">⏳ ${json.none ? "Aguardando o build iniciar…" : "Build em andamento (" + escapeHtml(json.status) + ")"}${runLink}</p>`;
      if (tries < 90) setTimeout(poll, 10000);
      return;
    }
    if (json.conclusion === "success") {
      area.innerHTML = `<p class="pos">✅ Build concluído${runLink}</p><div id="build-firmware" class="pos">Buscando firmware…</div>`;
      const { json: fw } = await api(`/api/build/firmware?run=${json.runId}`);
      const box = $("#build-firmware");
      box.innerHTML = fw.ok && fw.files.length
        ? "Firmware: " + fw.files.map((n) => `<a href="/api/build/firmware/download?run=${json.runId}&name=${encodeURIComponent(n)}">⬇ ${escapeHtml(n)}</a>`).join(" · ")
        : `Sem artefato pra baixar (expirado ou sem permissão).${runLink}`;
    } else {
      area.innerHTML = `<p class="pos">❌ Build falhou (${escapeHtml(json.conclusion || "")})${runLink} · <a id="build-log-link">ver erro</a></p><pre id="build-log" class="diff hidden"></pre>`;
      $("#build-log-link").onclick = async () => {
        const { json: lg } = await api(`/api/build/log?run=${json.runId}`);
        const pre = $("#build-log"); pre.textContent = lg.log || "(sem log)"; pre.classList.remove("hidden");
      };
    }
  };
  poll();
}

// ---- Behaviors configuráveis (dirigido pelo schema de tipos) ----
function behTypes() {
  return state.data.behaviorTypes || {};
}
function knownBehaviors() {
  return (state.data.behaviors || []).filter((b) => behTypes()[b.compatible]);
}
function usageCount(ref) {
  let n = 0;
  for (const l of state.data.layers) for (const b of l.bindings) if (b.ref === ref) n++;
  return n;
}
function behaviorSummary(b) {
  const t = behTypes()[b.compatible];
  if (!t) return "sem config";
  const parts = t.props.map((p) => (b.config[p.key] != null && b.config[p.key] !== "" ? `${p.dt.replace(/-ms$/, "")}: ${b.config[p.key]}` : null)).filter(Boolean);
  return parts.join(" · ") || "sem config";
}

// Campo de uma propriedade conforme o tipo (reutilizado em editar e criar).
function propField(prop, value, attrs) {
  const v = value ?? "";
  const hint = `<span class="hint-desc">${escapeHtml(prop.desc || "")}</span>`;
  if (prop.type === "enum") {
    const opts = ["", ...prop.options].map((o) => `<option value="${o}" ${o === v ? "selected" : ""}>${o || "— (padrão)"}</option>`).join("");
    return `<div><label>${prop.dt} ${hint}</label><select ${attrs}>${opts}</select></div>`;
  }
  const type = prop.type === "number" ? 'type="number" min="0"' : "";
  return `<div><label>${prop.dt} ${hint}</label><input ${type} value="${escapeHtml(v)}" placeholder="${escapeHtml(prop.desc || "")}" ${attrs} /></div>`;
}

function openBehaviors() {
  const body = $("#behaviors-body");
  $("#behaviors-result").textContent = "";
  state.newForm = null;

  const typeOpts = (state.data.behaviorTypeOptions || []).map((t) => `<option value="${t.compatible}">${escapeHtml(t.label)}</option>`).join("");
  const newSection = `<div class="beh-card beh-new">
    <h3>➕ Novo behavior</h3>
    <div class="beh-grid"><div><label>tipo</label><select id="nb-type">${typeOpts}</select></div>
    <div style="align-self:end"><button id="nb-start">Montar formulário</button></div></div>
    <div id="nb-form"></div>
  </div>`;

  const cards = knownBehaviors()
    .map((b) => {
      const t = behTypes()[b.compatible];
      const fields = t.props.map((p) => propField(p, b.config[p.key], `data-ref="${b.ref}" data-key="${p.key}"`)).join("");
      return `<div class="beh-card">
        <h3>&${escapeHtml(b.ref)} <span class="pos">— ${escapeHtml(t.label)}</span></h3>
        <p class="pos">${usageCount(b.ref)} tecla(s) usam este behavior — a mudança afeta todas.</p>
        <div class="beh-grid">${fields}</div>
      </div>`;
    })
    .join("");

  body.innerHTML = newSection + (cards || '<p class="pos">Nenhum behavior conhecido no keymap ainda.</p>');
  $("#nb-start").onclick = () => renderNewForm($("#nb-type").value);
  $("#behaviors-dialog").showModal();
}

function renderNewForm(compatible) {
  state.newForm = { compatible };
  const t = behTypes()[compatible];
  let bindingsHtml = "";
  if (t.bindingMode === "slots") {
    bindingsHtml = t.slots
      .map((s, i) => `<div><label>${s.name} <span class="hint-desc">${escapeHtml(s.desc)}</span></label><input data-nb-bind="${i}" value="${escapeHtml(s.default || "")}" /></div>`)
      .join("");
  } else if (t.bindingMode === "sequence") {
    bindingsHtml = `<div style="grid-column:1/-1"><label>bindings (sequência) <span class="hint-desc">ex.: &kp A &kp B</span></label><input data-nb-bind="0" placeholder="&kp A &kp B" /></div>`;
  }
  const props = t.props.map((p) => propField(p, "", `data-nb-key="${p.key}"`)).join("");
  $("#nb-form").innerHTML = `
    <div class="beh-grid">
      <div><label>nome <span class="hint-desc">identificador (ex.: my_mt)</span></label><input id="nb-name" placeholder="meu_behavior" /></div>
    </div>
    <div class="beh-grid">${bindingsHtml}</div>
    <div class="beh-grid">${props}</div>`;
}

async function saveBehaviors() {
  // config de behaviors existentes
  const byRef = {};
  for (const f of $("#behaviors-body").querySelectorAll("[data-ref]")) {
    (byRef[f.dataset.ref] ||= { ref: f.dataset.ref, config: {} }).config[f.dataset.key] = f.value === "" ? null : f.value;
  }
  // novo behavior (se o formulário estiver montado e tiver nome)
  const newBehaviors = [];
  if (state.newForm && $("#nb-name")) {
    const name = $("#nb-name").value.trim();
    if (name) {
      const bindings = [...$("#nb-form").querySelectorAll("[data-nb-bind]")].sort((a, b) => a.dataset.nbBind - b.dataset.nbBind).map((f) => f.value.trim()).filter(Boolean);
      const config = {};
      for (const f of $("#nb-form").querySelectorAll("[data-nb-key]")) config[f.dataset.nbKey] = f.value === "" ? null : f.value;
      newBehaviors.push({ ref: name, compatible: state.newForm.compatible, config, bindings });
    }
  }
  const { ok, json } = await api("/api/keymap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ behaviors: Object.values(byRef), newBehaviors, layers: state.data.layers }),
  });
  if (ok) {
    state.data = json;
    $("#behaviors-result").textContent = "✓ Salvo.";
    render();
    openBehaviors();
  } else {
    const errs = [...(json.newBehaviorErrors || []), ...(json.behaviorValidation?.errors || []), ...(json.validation?.errors || [])];
    $("#behaviors-result").textContent = "⚠ " + (errs.map((e) => e.message).join(" ") || "não salvo");
  }
}

// ---- Keyboard tester (D5) ----
const CHATTER_MS = 30; // keydown < 30ms após o último keyup da mesma tecla → repique

function newMetrics() {
  return { total: 0, lastKey: "—", lastHold: null, perPos: {}, chatter: [], downAt: {}, lastUp: {} };
}

// Keycode testável de um binding: &kp/&sk → keycode; tap de mod-tap/layer-tap/hold-taps
// custom (2 params) → último param; &trans → resolve na layer base; demais → null.
function testableKeycode(b, pos) {
  if (!b) return null;
  if (b.ref === "trans") {
    const base = state.data.layers[0].bindings[pos];
    return base && base.ref !== "trans" ? testableKeycode(base, pos) : null;
  }
  if ((b.ref === "kp" || b.ref === "sk") && b.params.length >= 1) return b.params[0];
  // mod-tap, layer-tap e hold-taps custom (ex.: holdtap, mo_mt): tap é o último parâmetro
  if (b.params.length === 2 && ["mt", "lt", "holdtap", "mo_mt"].includes(b.ref)) return b.params[1];
  return null;
}

// Índice keycode(ZMK) → posição, a partir da layer selecionada (com resolução de behaviors).
function layerKpIndex(i) {
  const idx = {};
  const layer = state.data.layers[i];
  if (!layer) return idx;
  layer.bindings.forEach((b, pos) => {
    const k = testableKeycode(b, pos);
    if (k) idx[k.toUpperCase()] = pos;
  });
  return idx;
}

function refreshKpIndex() {
  state._kpIndex = layerKpIndex(state.active);
}

function mappableCount(i) {
  return Object.keys(layerKpIndex(i)).length;
}

// Possíveis tokens ZMK para o evento do teclado (event.code é posição física, layout-independente).
function zmkCandidates(e) {
  const out = [];
  const c = e.code || "";
  let m;
  if ((m = /^Key([A-Z])$/.exec(c))) out.push(m[1]);
  else if ((m = /^Digit([0-9])$/.exec(c))) out.push("N" + m[1], m[1]);
  else if ((m = /^F([0-9]{1,2})$/.exec(c))) out.push("F" + m[1]);
  const codeMap = {
    Space: "SPACE", Enter: ["RET", "ENTER", "RETURN"], Backspace: ["BSPC", "BACKSPACE"], Tab: "TAB",
    Escape: ["ESC", "ESCAPE"], Minus: "MINUS", Equal: "EQUAL", BracketLeft: ["LBKT", "LEFT_BRACKET"],
    BracketRight: ["RBKT", "RIGHT_BRACKET"], Semicolon: ["SEMI", "SEMICOLON"], Quote: ["SQT", "APOS", "APOSTROPHE"],
    Backquote: "GRAVE", Comma: "COMMA", Period: "DOT", Slash: ["FSLH", "SLASH"], Backslash: ["BSLH", "BACKSLASH"],
    ShiftLeft: ["LSHFT", "LEFT_SHIFT"], ShiftRight: ["RSHFT", "RIGHT_SHIFT"], ControlLeft: ["LCTRL", "LEFT_CONTROL"],
    ControlRight: ["RCTRL", "RIGHT_CONTROL"], AltLeft: ["LALT", "LEFT_ALT"], AltRight: ["RALT", "RIGHT_ALT"],
    MetaLeft: ["LGUI", "LEFT_GUI", "LEFT_COMMAND", "LCMD"], MetaRight: ["RGUI", "RIGHT_GUI", "RCMD"],
    ArrowLeft: ["LEFT", "LEFT_ARROW"], ArrowRight: ["RIGHT", "RIGHT_ARROW"], ArrowUp: ["UP", "UP_ARROW"],
    ArrowDown: ["DOWN", "DOWN_ARROW"], Home: "HOME", End: "END", CapsLock: ["CAPS", "CAPSLOCK"],
  };
  const extra = codeMap[c];
  if (extra) out.push(...(Array.isArray(extra) ? extra : [extra]));
  return out.map((t) => String(t).toUpperCase());
}

function posForEvent(e, idx) {
  for (const t of zmkCandidates(e)) if (t in idx) return idx[t];
  return null;
}

function isTextField(e) {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

function onKeyDown(e) {
  if (!state.tester || isTextField(e)) return; // deixa campos de texto (ex.: renomear) funcionarem
  e.preventDefault();
  const m = state.metrics;
  const now = performance.now();
  const code = e.code || e.key;
  m.lastKey = `${e.code || "?"}${e.key ? " (" + e.key + ")" : ""}`;
  if (!e.repeat) {
    // chatter: novo keydown logo após o último keyup da mesma tecla
    if (m.lastUp[code] != null && now - m.lastUp[code] < CHATTER_MS) {
      m.chatter.unshift(`${code}: repique (${Math.round(now - m.lastUp[code])}ms)`);
      m.chatter = m.chatter.slice(0, 5);
    }
    m.total++;
    m.downAt[code] = now;
    const pos = posForEvent(e, state._kpIndex);
    if (pos != null) {
      m.perPos[pos] = (m.perPos[pos] || 0) + 1;
      state.pressed.add(pos);
    }
  }
  renderBoard();
  renderTesterPanel($("#palette"));
}

function onKeyUp(e) {
  if (!state.tester || isTextField(e)) return;
  e.preventDefault();
  const m = state.metrics;
  const now = performance.now();
  const code = e.code || e.key;
  if (m.downAt[code] != null) {
    m.lastHold = Math.round(now - m.downAt[code]);
    delete m.downAt[code];
  }
  m.lastUp[code] = now;
  const pos = posForEvent(e, state._kpIndex);
  if (pos != null) state.pressed.delete(pos);
  renderBoard();
  renderTesterPanel($("#palette"));
}

function toggleTester() {
  state.tester = !state.tester;
  $("#tester").classList.toggle("active", state.tester);
  state.pressed = new Set();
  if (state.tester) {
    state.metrics = newMetrics();
    refreshKpIndex();
    state.selected = null;
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
  } else {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
  }
  render();
}

function renderTesterPanel(el) {
  const m = state.metrics || newMetrics();
  const touched = Object.keys(m.perPos).length;
  const layer = state.data.layers[state.active];
  const layerName = layer.displayName || layer.name;
  const mappable = mappableCount(state.active);
  el.innerHTML = `
    <h2>🧪 Tester</h2>
    <p class="pos">Mapeando contra a layer <strong>${escapeHtml(layerName)}</strong>.
      Para testar esta layer, <strong>ative-a no teclado físico</strong> (o firmware decide o keycode enviado).</p>
    <div class="tester-metric"><span>Última tecla</span><b>${escapeHtml(m.lastKey)}</b></div>
    <div class="tester-metric"><span>Total de toques</span><b>${m.total}</b></div>
    <div class="tester-metric"><span>Último hold</span><b>${m.lastHold == null ? "—" : m.lastHold + " ms"}</b></div>
    <div class="tester-metric"><span>Posições tocadas</span><b>${touched}</b></div>
    <div class="tester-metric"><span>Mapeáveis nesta layer</span><b>${mappable}/58</b></div>
    ${m.chatter.length ? `<div class="chatter">⚠ chatter:<br>${m.chatter.map(escapeHtml).join("<br>")}</div>` : ""}
    <p class="pos" style="margin-top:12px">Sem medição de pressão analógica — o Lily58 usa switches digitais.
      O foco é registro/resposta/tempo e repique.</p>
  `;
}

let flashTimer;
function flash(msg, isErr) {
  const el = $("#validation");
  el.classList.remove("hidden");
  el.className = "validation " + (isErr ? "err" : "ok");
  el.textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => showValidation(state.data?.validation), 4000);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

$("#save").onclick = save;
$("#tester").onclick = toggleTester;
$("#reload").onclick = reload;
$("#pull-build").onclick = pullFromBuildUI;
$("#pull-visual-btn").onclick = () => setPullView("visual");
$("#pull-text-btn").onclick = () => setPullView("text");
$("#pull-adopt").onclick = adoptFromBuild;
$("#close-pull").onclick = () => $("#pull-dialog").close();
$("#cheatsheet").onclick = cheatsheet;
$("#close-cheatsheet").onclick = () => $("#cheatsheet-dialog").close();
$("#behaviors").onclick = openBehaviors;
$("#behaviors-save").onclick = saveBehaviors;
$("#close-behaviors").onclick = () => $("#behaviors-dialog").close();
$("#sync").onclick = openSync;
$("#sync-visual-btn").onclick = () => setSyncView("visual");
$("#sync-text-btn").onclick = () => setSyncView("text");
$("#sync-confirm").onclick = confirmSync;
$("#close-sync").onclick = () => $("#sync-dialog").close();
$("#profile-select").onchange = (e) => selectProfile(e.target.value);
$("#new-profile").onclick = openNewProfile;
$("#create-profile").onclick = createProfile;
$("#close-profile").onclick = () => $("#profile-dialog").close();
$("#preview").onclick = openPreview;
$("#pv-visual").onclick = () => setPreviewView("visual");
$("#pv-text").onclick = () => setPreviewView("text");
$("#preview-save").onclick = async () => { await save(); $("#preview-dialog").close(); };
$("#close-preview").onclick = () => $("#preview-dialog").close();

load();
