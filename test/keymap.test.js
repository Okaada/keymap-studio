import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute, resolve } from "node:path";

import { parseKeymap, bindingToString } from "../src/keymap/parser.js";
import { serializeKeymap, snapshotBindings, snapshotDisplayNames } from "../src/keymap/serializer.js";
import { validateKeymap, validateBehaviors, validateNewBehavior } from "../src/keymap/validate.js";
import { applyIncoming } from "../src/keymap/apply.js";
import { diffText } from "../src/keymap/diff.js";
import { visualDiff } from "../src/keymap/visualDiff.js";
import { resolveActive } from "../src/profiles/profiles.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
// Resolve o keymap/layout pelo perfil ativo (ou migra do config legado).
const active = await resolveActive(ROOT);
const layout = JSON.parse(await readFile(active.layoutPath, "utf8"));
const keymapPath = active.keymapPath;
const SAMPLE = await readFile(keymapPath, "utf8");

test("parse: encontra as layers e 58 bindings cada", () => {
  const m = parseKeymap(SAMPLE);
  assert.ok(m.layers.length >= 1);
  for (const l of m.layers) assert.equal(l.bindings.length, layout.keyCount);
});

test("parse: descobre behaviors custom (holdtap, mo_mt) com aridade", () => {
  const m = parseKeymap(SAMPLE);
  const refs = Object.fromEntries(m.customBehaviors.map((c) => [c.ref, c.arity]));
  assert.equal(refs.holdtap, 2);
  assert.equal(refs.mo_mt, 2);
});

test("round-trip no-op: serializar sem editar devolve arquivo idêntico", () => {
  const m = parseKeymap(SAMPLE);
  const snap = snapshotBindings(m);
  const out = serializeKeymap(m, snap, layout.rows);
  assert.equal(out, SAMPLE);
});

test("edição de 1 tecla: só o bindings daquela layer muda", () => {
  const m = parseKeymap(SAMPLE);
  const snap = snapshotBindings(m);
  // troca a posição 1 da primeira layer
  m.layers[0].bindings[1] = { ref: "kp", params: ["EXCL"] };
  const out = serializeKeymap(m, snap, layout.rows);

  assert.notEqual(out, SAMPLE);
  // reparse confirma o novo valor e preserva as demais layers
  const m2 = parseKeymap(out);
  assert.equal(bindingToString(m2.layers[0].bindings[1]), "&kp EXCL");
  for (let i = 1; i < m.layers.length; i++) {
    assert.deepEqual(snapshotBindings(m2)[i], snap[i]);
  }
  // a 1ª layer continua com 58 posições
  assert.equal(m2.layers[0].bindings.length, layout.keyCount);
});

test("round-trip estável: reparse+serialize da saída editada é idempotente", () => {
  const m = parseKeymap(SAMPLE);
  const snap = snapshotBindings(m);
  m.layers[0].bindings[1] = { ref: "kp", params: ["EXCL"] };
  const out1 = serializeKeymap(m, snap, layout.rows);
  const m2 = parseKeymap(out1);
  const out2 = serializeKeymap(m2, snapshotBindings(m2), layout.rows);
  assert.equal(out2, out1);
});

test("rename: insere display-name numa layer sem nome", () => {
  const m = parseKeymap(SAMPLE);
  const snap = snapshotBindings(m);
  const dns = snapshotDisplayNames(m);
  m.layers[0].displayName = "Base";
  const out = serializeKeymap(m, snap, layout.rows, dns);

  assert.ok(out.includes('display-name = "Base";'));
  const m2 = parseKeymap(out);
  assert.equal(m2.layers[0].displayName, "Base");
  // demais layers e bindings intactos
  for (let i = 1; i < m.layers.length; i++) assert.equal(m2.layers[i].displayName, null);
  assert.deepEqual(snapshotBindings(m2), snap);
});

test("rename: atualiza display-name existente sem tocar no resto", () => {
  const m0 = parseKeymap(SAMPLE);
  m0.layers[1].displayName = "Nav";
  const withDn = serializeKeymap(m0, snapshotBindings(m0), layout.rows, snapshotDisplayNames(m0));

  const m = parseKeymap(withDn);
  const snap = snapshotBindings(m);
  const dns = snapshotDisplayNames(m);
  m.layers[1].displayName = "Navigation2";
  const out = serializeKeymap(m, snap, layout.rows, dns);

  const m2 = parseKeymap(out);
  assert.equal(m2.layers[1].displayName, "Navigation2");
  assert.equal(out.match(/display-name/g).length, 1); // ainda só 1 display-name
});

test("rename: no-op (sem renomear) devolve arquivo idêntico", () => {
  const m = parseKeymap(SAMPLE);
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  assert.equal(out, SAMPLE);
});

test("rename + edição de binding na mesma layer coexistem", () => {
  const m = parseKeymap(SAMPLE);
  const snap = snapshotBindings(m);
  const dns = snapshotDisplayNames(m);
  m.layers[0].displayName = "Base";
  m.layers[0].bindings[1] = { ref: "kp", params: ["EXCL"] };
  const out = serializeKeymap(m, snap, layout.rows, dns);

  const m2 = parseKeymap(out);
  assert.equal(m2.layers[0].displayName, "Base");
  assert.equal(bindingToString(m2.layers[0].bindings[1]), "&kp EXCL");
  assert.equal(m2.layers[0].bindings.length, layout.keyCount);
});

test("behaviors: parseia hold-taps com config", () => {
  const m = parseKeymap(SAMPLE);
  const ht = m.behaviors.find((b) => b.ref === "holdtap");
  assert.ok(ht);
  assert.equal(ht.isHoldTap, true);
  assert.equal(ht.config.tappingTermMs, 200);
  assert.equal(ht.config.flavor, "tap-preferred");
  assert.equal(ht.config.quickTapMs, 175);
});

test("behaviors: atualizar tapping-term-ms só muda o valor", () => {
  const m = parseKeymap(SAMPLE);
  m.behaviors.find((b) => b.ref === "holdtap").config.tappingTermMs = 180;
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  assert.ok(out.includes("tapping-term-ms = <180>"));
  const m2 = parseKeymap(out);
  assert.equal(m2.behaviors.find((b) => b.ref === "holdtap").config.tappingTermMs, 180);
  // mo_mt intocado
  assert.equal(m2.behaviors.find((b) => b.ref === "mo_mt").config.tappingTermMs, 200);
});

test("behaviors: inserir quick-tap-ms ausente", () => {
  const m = parseKeymap(SAMPLE);
  m.behaviors.find((b) => b.ref === "holdtap").config.quickTapMs = 150;
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  assert.ok(out.includes("quick-tap-ms = <150>;"));
  const m2 = parseKeymap(out);
  assert.equal(m2.behaviors.find((b) => b.ref === "holdtap").config.quickTapMs, 150);
});

test("behaviors: no-op (sem mudar config) é idêntico", () => {
  const m = parseKeymap(SAMPLE);
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  assert.equal(out, SAMPLE);
});

test("behaviors: validação rejeita ms negativo e flavor inválido", () => {
  const m = parseKeymap(SAMPLE);
  m.behaviors.find((b) => b.ref === "holdtap").config.tappingTermMs = -5;
  m.behaviors.find((b) => b.ref === "mo_mt").config.flavor = "wrong";
  const v = validateBehaviors(m);
  assert.ok(!v.valid);
  assert.ok(v.errors.some((e) => e.prop === "tappingTermMs"));
  assert.ok(v.errors.some((e) => e.prop === "flavor"));
});

test("criar behavior: novo hold-tap é inserido e reparseável", () => {
  const m = parseKeymap(SAMPLE);
  m.newBehaviors.push({ ref: "mt_test", compatible: "zmk,behavior-hold-tap", config: { tappingTermMs: 220, flavor: "balanced" }, bindings: ["&kp", "&kp"] });
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  const m2 = parseKeymap(out);
  const nb = m2.behaviors.find((b) => b.ref === "mt_test");
  assert.ok(nb, "novo behavior deve existir");
  assert.equal(nb.compatible, "zmk,behavior-hold-tap");
  assert.equal(nb.config.tappingTermMs, 220);
  assert.equal(nb.config.flavor, "balanced");
  assert.equal(nb.arity, 2);
  // os behaviors existentes continuam lá
  assert.ok(m2.behaviors.find((b) => b.ref === "holdtap"));
});

test("criar behavior: macro (tipo não hold-tap) com sequência", () => {
  const m = parseKeymap(SAMPLE);
  m.newBehaviors.push({ ref: "my_macro", compatible: "zmk,behavior-macro", config: { waitMs: 30 }, bindings: ["&kp A", "&kp B"] });
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  const m2 = parseKeymap(out);
  const nb = m2.behaviors.find((b) => b.ref === "my_macro");
  assert.ok(nb);
  assert.equal(nb.compatible, "zmk,behavior-macro");
  assert.equal(nb.config.waitMs, 30);
  assert.ok(out.includes("bindings = <&kp A &kp B>;"));
});

test("criar behavior: no-op sem novos é idêntico", () => {
  const m = parseKeymap(SAMPLE);
  const out = serializeKeymap(m, snapshotBindings(m), layout.rows, snapshotDisplayNames(m));
  assert.equal(out, SAMPLE);
});

test("validateNewBehavior: rejeita nome inválido e duplicado", () => {
  assert.ok(!validateNewBehavior({ ref: "holdtap", compatible: "zmk,behavior-hold-tap", bindings: ["&kp", "&kp"] }, ["holdtap"]).valid);
  assert.ok(!validateNewBehavior({ ref: "1bad", compatible: "zmk,behavior-hold-tap", bindings: ["&kp", "&kp"] }, []).valid);
  assert.ok(validateNewBehavior({ ref: "ht_new", compatible: "zmk,behavior-hold-tap", config: { tappingTermMs: 200 }, bindings: ["&kp", "&kp"] }, ["holdtap"]).valid);
});

test("validação: keymap de exemplo é válido", () => {
  const m = parseKeymap(SAMPLE);
  const v = validateKeymap(m, layout.keyCount);
  assert.ok(v.valid, JSON.stringify(v.errors));
});

test("validação: aridade errada é detectada", () => {
  const m = parseKeymap(SAMPLE);
  m.layers[0].bindings[0] = { ref: "kp", params: ["A", "B"] }; // &kp exige 1
  const v = validateKeymap(m, layout.keyCount);
  assert.ok(!v.valid);
  assert.ok(v.errors.some((e) => e.kind === "arity"));
});

test("validação: tamanho de layer errado é detectado", () => {
  const m = parseKeymap(SAMPLE);
  m.layers[0].bindings.pop();
  const v = validateKeymap(m, layout.keyCount);
  assert.ok(!v.valid);
  assert.ok(v.errors.some((e) => e.kind === "layer-size"));
});

// --- dry-run / preview (diff-preview-no-editor) ---

// Reproduz o dry-run do endpoint sem subir o servidor: aplica numa cópia, serializa.
function previewText(sample, incoming) {
  const base = parseKeymap(sample);
  const original = snapshotBindings(base);
  const originalDN = snapshotDisplayNames(base);
  const draft = structuredClone(base);
  const { newBehaviorErrors } = applyIncoming(draft, incoming);
  const validation = validateKeymap(draft, layout.keyCount);
  const behaviorValidation = validateBehaviors(draft);
  const pending = serializeKeymap(draft, original, layout.rows, originalDN);
  return { base, pending, validation, behaviorValidation, newBehaviorErrors };
}

test("preview: edição não muta o modelo base nem grava", () => {
  const base = parseKeymap(SAMPLE);
  const snapBefore = snapshotBindings(base);
  const dnBefore = snapshotDisplayNames(base);
  const draft = structuredClone(base);
  // edita só a cópia
  draft.layers[0].bindings[1] = { ref: "kp", params: ["EXCL"] };
  applyIncoming(draft, { layers: draft.layers.map((l) => ({ bindings: l.bindings })) });
  // o base permanece idêntico (nada vazou pro modelo original)
  assert.deepEqual(snapshotBindings(base), snapBefore);
  assert.deepEqual(snapshotDisplayNames(base), dnBefore);
});

test("preview: fidelidade — mesmo texto que o save gravaria", () => {
  const incoming = { layers: parseKeymap(SAMPLE).layers.map((l, i) => ({
    bindings: i === 0 ? l.bindings.map((b, j) => (j === 1 ? { ref: "kp", params: ["EXCL"] } : b)) : l.bindings,
  })) };
  // caminho do preview (cópia)
  const { pending } = previewText(SAMPLE, incoming);
  // caminho do save (muta o próprio modelo) a partir do mesmo baseline
  const m = parseKeymap(SAMPLE);
  const original = snapshotBindings(m);
  const originalDN = snapshotDisplayNames(m);
  applyIncoming(m, incoming);
  const saved = serializeKeymap(m, original, layout.rows, originalDN);
  assert.equal(pending, saved);
});

test("preview: no-op não produz diff", async () => {
  const { pending } = previewText(SAMPLE, { layers: parseKeymap(SAMPLE).layers.map((l) => ({ bindings: l.bindings })) });
  const d = await diffText(SAMPLE, pending, { labelA: "atual", labelB: "pendente" });
  assert.equal(d.changed, false);
  assert.equal(d.diff, "");
});

test("preview: edição produz diff não-vazio", async () => {
  const incoming = { layers: parseKeymap(SAMPLE).layers.map((l, i) => ({
    bindings: i === 0 ? l.bindings.map((b, j) => (j === 1 ? { ref: "kp", params: ["EXCL"] } : b)) : l.bindings,
  })) };
  const { pending } = previewText(SAMPLE, incoming);
  const d = await diffText(SAMPLE, pending, { labelA: "atual", labelB: "pendente" });
  assert.equal(d.changed, true);
  assert.ok(d.diff.includes("EXCL"));
});

test("preview: edição inválida reporta erros (sem exigir gravação)", () => {
  const { newBehaviorErrors } = previewText(SAMPLE, {
    newBehaviors: [{ ref: "holdtap", compatible: "zmk,behavior-hold-tap", bindings: ["&kp", "&kp"] }], // nome duplicado
  });
  assert.ok(newBehaviorErrors.length > 0);
});

// --- diff visual (diff-visual-no-board) ---

test("visualDiff: binding alterado vira modified com antes/depois", () => {
  const m = parseKeymap(SAMPLE);
  const before = m.layers.map((l) => ({ name: l.name, bindings: l.bindings }));
  const after = structuredClone(before);
  after[0].bindings[1] = { ref: "kp", params: ["EXCL"] };
  const d = visualDiff({ layersBefore: before, layersAfter: after });
  const l0 = d.layers.find((l) => l.index === 0);
  assert.ok(l0, "layer 0 deve aparecer no diff");
  const ch = l0.changes.find((c) => c.pos === 1);
  assert.equal(ch.kind, "modified");
  assert.equal(ch.after, "&kp EXCL");
  // só a layer 0 mudou
  assert.equal(d.layers.length, 1);
});

test("visualDiff: classifica added / removed / modified", () => {
  const before = [{ name: "l0", bindings: [{ ref: "trans", params: [] }, { ref: "kp", params: ["A"] }, { ref: "kp", params: ["B"] }] }];
  const after = [{ name: "l0", bindings: [{ ref: "kp", params: ["X"] }, { ref: "trans", params: [] }, { ref: "kp", params: ["C"] }] }];
  const d = visualDiff({ layersBefore: before, layersAfter: after });
  const kind = Object.fromEntries(d.layers[0].changes.map((c) => [c.pos, c.kind]));
  assert.equal(kind[0], "added");
  assert.equal(kind[1], "removed");
  assert.equal(kind[2], "modified");
});

test("visualDiff: behaviors e renames; no-op vazio", () => {
  const layers = [{ name: "l0", bindings: [{ ref: "kp", params: ["A"] }] }];
  const d = visualDiff({
    layersBefore: layers, layersAfter: layers,
    dnBefore: [null], dnAfter: ["Base"],
    behaviorsBefore: [{ ref: "holdtap", config: { flavor: "hold-preferred", tappingTermMs: 200 } }],
    behaviorsAfter: [{ ref: "holdtap", config: { flavor: "balanced", tappingTermMs: 200 } }],
  });
  assert.equal(d.layers.length, 0);
  assert.ok(d.behaviors.some((b) => b.ref === "holdtap" && b.prop === "flavor" && b.after === "balanced"));
  assert.ok(d.renames.some((r) => r.index === 0 && r.after === "Base"));

  const z = visualDiff({ layersBefore: layers, layersAfter: layers });
  assert.equal(z.layers.length, 0);
  assert.equal(z.behaviors.length, 0);
  assert.equal(z.renames.length, 0);
});

// --- diff visual no sync (sync-visual-diff) ---

test("sync: visualDiff entre dois .keymap parseados detecta a mudança", () => {
  const before = parseKeymap(SAMPLE);
  const after = parseKeymap(SAMPLE.replace("&kp N1", "&kp EXCL")); // muda só a pos 1 da layer 0
  const d = visualDiff({
    layersBefore: before.layers, layersAfter: after.layers,
    behaviorsBefore: before.behaviors, behaviorsAfter: after.behaviors,
  });
  const l0 = d.layers.find((l) => l.index === 0);
  assert.ok(l0 && l0.changes.some((c) => c.after === "&kp EXCL" && c.kind === "modified"));
});

test("sync preview: destino ausente → visual null, sem crash", async () => {
  const { preview } = await import("../src/sync/repo.js");
  const r = await preview({ path: ROOT, keymapDest: "__inexistente__.keymap" }, keymapPath);
  assert.equal(r.visual, null);
  assert.equal(r.changed, true); // local existe, destino não → há diferença
});
