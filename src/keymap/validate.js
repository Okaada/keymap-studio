// Validação (task 3.3 / capability agent-keymap-editing):
// - contagem de bindings por layer == nº de posições físicas do Lily58;
// - aridade de cada binding cujo behavior está no catálogo (behaviors custom e
//   desconhecidos são opacos: não travam, mas ainda contam como 1 posição).

import { baseBehavior, arityOf, effectiveCatalog } from "./catalog.js";

export function validateKeymap(model, keyCount) {
  const errors = [];
  const custom = new Set((model.customBehaviors || []).map((c) => c.ref));

  for (const layer of model.layers) {
    const label = layer.displayName || layer.name;

    if (layer.bindings.length !== keyCount) {
      errors.push({
        layer: label,
        kind: "layer-size",
        message: `Layer "${label}" tem ${layer.bindings.length} bindings, esperado ${keyCount} (posições do Lily58).`,
      });
    }

    layer.bindings.forEach((b, pos) => {
      const entry = baseBehavior(b.ref);
      if (!entry) return; // custom/desconhecido → opaco
      const { min, max } = arityOf(entry);
      const n = b.params.length;
      if (n < min || n > max) {
        const exp = min === max ? `${min}` : `${min}–${max}`;
        errors.push({
          layer: label,
          kind: "arity",
          pos,
          message: `Layer "${label}", posição ${pos}: &${b.ref} recebeu ${n} parâmetro(s), esperado ${exp}.`,
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

import { typeFor, FLAVOR_OPTIONS } from "./behaviorTypes.js";

// Valida as props de um objeto de config contra o schema do tipo.
function validateConfigAgainst(type, ref, config, errors) {
  for (const prop of type.props) {
    const v = config?.[prop.key];
    if (v == null || v === "") continue;
    if (prop.type === "number" && (!Number.isInteger(Number(v)) || Number(v) < 0)) {
      errors.push({ behavior: ref, prop: prop.key, message: `${ref}: ${prop.dt} deve ser um inteiro ≥ 0 (recebido "${v}").` });
    }
    if (prop.type === "enum" && !prop.options.includes(v)) {
      errors.push({ behavior: ref, prop: prop.key, message: `${ref}: ${prop.dt} inválido "${v}" (use ${prop.options.join(", ")}).` });
    }
  }
}

// Valida a config dos behaviors (qualquer tipo conhecido): props numéricas ≥ 0, enums válidos.
export function validateBehaviors(model) {
  const errors = [];
  for (const b of model.behaviors || []) {
    const t = typeFor(b.compatible);
    if (t) validateConfigAgainst(t, b.ref, b.config, errors);
  }
  return { valid: errors.length === 0, errors };
}

// Valida a definição de um novo behavior antes de inserir.
export function validateNewBehavior(nb, existingRefs) {
  const errors = [];
  const ref = (nb.ref || "").trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) errors.push({ message: `Nome inválido "${ref}" (use letras, números e _, começando por letra/_).` });
  if (existingRefs.includes(ref)) errors.push({ message: `Já existe um behavior chamado "${ref}".` });
  const t = typeFor(nb.compatible);
  if (!t) errors.push({ message: `Tipo (compatible) desconhecido: "${nb.compatible}".` });
  else {
    if (t.bindingMode !== "none" && !(nb.bindings || []).filter((x) => String(x).trim()).length) {
      errors.push({ message: `${ref}: informe o(s) binding(s) deste tipo.` });
    }
    validateConfigAgainst(t, ref || "novo", nb.config || {}, errors);
  }
  return { valid: errors.length === 0, errors };
}

export { effectiveCatalog, FLAVOR_OPTIONS };
