// Aplica um payload de edição (layers + behaviors + newBehaviors) sobre um modelo.
// Mesma lógica usada pelo save e pelo dry-run (preview) — o preview roda numa CÓPIA
// do modelo, então esta função pode mutar livremente o `model` que recebe.

import { typeFor } from "./behaviorTypes.js";
import { validateNewBehavior } from "./validate.js";

export function applyIncoming(model, incoming) {
  // Bindings/nomes por índice de layer.
  (incoming.layers || []).forEach((l, i) => {
    const layer = model.layers[i];
    if (!layer) return;
    if (Array.isArray(l.bindings)) {
      layer.bindings = l.bindings.map((b) => ({ ref: b.ref, params: Array.isArray(b.params) ? b.params : [] }));
    }
    if (l.displayName !== undefined) {
      layer.displayName = l.displayName === null ? null : String(l.displayName);
    }
  });

  // Config de behaviors existentes (qualquer tipo conhecido): casa por ref e aplica por schema.
  if (Array.isArray(incoming.behaviors)) {
    for (const inB of incoming.behaviors) {
      const b = model.behaviors.find((x) => x.ref === inB.ref);
      const t = b && typeFor(b.compatible);
      if (!t || !inB.config) continue;
      for (const prop of t.props) {
        if (inB.config[prop.key] === undefined) continue;
        const v = inB.config[prop.key];
        b.config[prop.key] = v === null || v === "" ? null : prop.type === "number" ? Number(v) : v;
      }
    }
  }

  // Criar novos behaviors (valida cada um; nomes únicos considerando os já na fila).
  const newBehaviorErrors = [];
  if (Array.isArray(incoming.newBehaviors) && incoming.newBehaviors.length) {
    const existing = model.behaviors.map((b) => b.ref);
    const queued = [];
    for (const nb of incoming.newBehaviors) {
      const v = validateNewBehavior(nb, [...existing, ...queued]);
      if (!v.valid) { newBehaviorErrors.push(...v.errors); continue; }
      queued.push(nb.ref.trim());
      model.newBehaviors.push({ ref: nb.ref.trim(), compatible: nb.compatible, config: nb.config || {}, bindings: nb.bindings || [] });
    }
  }

  return { newBehaviorErrors };
}
