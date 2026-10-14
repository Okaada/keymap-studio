// Diff estruturado (não-textual) entre o estado salvo e o pendente, para render visual
// no board. Puro e testável: recebe os dois lados já extraídos dos modelos.

import { bindingToString } from "./parser.js";

const EMPTY = new Set(["trans", "none"]);
const isEmpty = (b) => !b || EMPTY.has(b.ref);

// Só para colorir: antes vazio→real = added; real→vazio = removed; real→real = modified.
function classify(before, after) {
  const b = isEmpty(before);
  const a = isEmpty(after);
  if (b && !a) return "added";
  if (!b && a) return "removed";
  return "modified";
}

export function visualDiff({
  layersBefore = [],
  layersAfter = [],
  dnBefore = [],
  dnAfter = [],
  behaviorsBefore = [],
  behaviorsAfter = [],
} = {}) {
  // Teclas por posição/layer
  const layers = [];
  layersAfter.forEach((la, index) => {
    const lb = layersBefore[index];
    if (!lb) return;
    const changes = [];
    const n = Math.max(la.bindings.length, lb.bindings.length);
    for (let pos = 0; pos < n; pos++) {
      const before = lb.bindings[pos];
      const after = la.bindings[pos];
      const bs = before ? bindingToString(before) : "";
      const as = after ? bindingToString(after) : "";
      if (bs !== as) changes.push({ pos, before: bs, after: as, kind: classify(before, after) });
    }
    if (changes.length) layers.push({ index, name: la.name, changes });
  });

  // Config de behaviors (por ref/prop)
  const behaviors = [];
  for (const after of behaviorsAfter) {
    const before = behaviorsBefore.find((b) => b.ref === after.ref);
    if (!before) continue;
    const keys = new Set([...Object.keys(before.config || {}), ...Object.keys(after.config || {})]);
    for (const prop of keys) {
      const bv = before.config?.[prop] ?? null;
      const av = after.config?.[prop] ?? null;
      if (bv !== av) behaviors.push({ ref: after.ref, prop, before: bv, after: av });
    }
  }

  // Renomeações de layer (display-name)
  const renames = [];
  dnAfter.forEach((av, index) => {
    const bv = dnBefore[index] ?? null;
    const a = av ?? null;
    if (bv !== a) renames.push({ index, before: bv, after: a });
  });

  return { layers, behaviors, renames };
}
