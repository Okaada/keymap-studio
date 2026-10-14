// Serializer por offset (D2): monta uma lista de edições {start,end,text} — arrays
// `bindings` alterados e/ou `display-name` renomeados — e as aplica da maior offset para a
// menor, preservando o resto do arquivo byte a byte. Sem edições → arquivo idêntico (no-op).

import { bindingToString } from "./parser.js";
import { typeFor, renderBehaviorNode } from "./behaviorTypes.js";

function indentBefore(text, pos) {
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const line = text.slice(lineStart, pos);
  const m = /^(\s*)/.exec(line);
  return (m ? m[1] : "").replace(/[^\t ]/g, "");
}

function formatInner(bindingStrings, rows, indent) {
  const lines = [];
  for (const [startIdx, endIdx] of rows) {
    lines.push(indent + bindingStrings.slice(startIdx, endIdx).join("  "));
  }
  return "\n" + lines.join("\n") + "\n" + indent;
}

// Nome seguro para gravar como string de devicetree.
function sanitizeName(name) {
  return String(name).replace(/[\r\n]+/g, " ").replace(/"/g, '\\"').trim().slice(0, 64);
}

// model: resultado do parseKeymap (bindings/displayName possivelmente editados)
// originalByLayer: snapshot das strings de binding por layer no parse
// rows: layout.rows (quebra de linha)
// originalDisplayNames: snapshot dos display-name por layer (opcional; habilita rename)
export function serializeKeymap(model, originalByLayer, rows, originalDisplayNames = null) {
  const edits = [];

  model.layers.forEach((layer, i) => {
    // (a) bindings alterados
    const current = layer.bindings.map(bindingToString);
    const original = originalByLayer[i];
    const bindingsChanged =
      !original ||
      current.length !== original.length ||
      current.some((s, j) => s !== original[j]);
    if (bindingsChanged) {
      const indent = indentBefore(model.text, layer.start - 1) || "            ";
      const useRows =
        rows && rows.length && rows[rows.length - 1][1] === current.length ? rows : [[0, current.length]];
      edits.push({ start: layer.start, end: layer.end, text: formatInner(current, useRows, indent) });
    }

    // (b) display-name renomeado (só quando o snapshot de nomes foi fornecido)
    if (originalDisplayNames && layer.displayName !== originalDisplayNames[i]) {
      const value = sanitizeName(layer.displayName ?? "");
      if (layer.dnValue) {
        edits.push({ start: layer.dnValue.start, end: layer.dnValue.end, text: value });
      } else {
        edits.push({ start: layer.dnInsertAt, end: layer.dnInsertAt, text: `\n${layer.dnIndent}display-name = "${value}";` });
      }
    }
  });

  // (c) propriedades de behaviors alteradas (regiões carregam o valor original)
  for (const b of model.behaviors || []) {
    const t = typeFor(b.compatible);
    if (!t) continue;
    const schema = Object.fromEntries(t.props.map((p) => [p.key, p]));
    for (const key of Object.keys(b.props)) {
      const region = b.props[key];
      const cur = b.config[key];
      const orig = region ? model.text.slice(region.start, region.end) : null;
      if (String(cur ?? "") === String(orig ?? "")) continue; // sem mudança
      if (region) {
        edits.push({ start: region.start, end: region.end, text: String(cur) });
      } else if (cur != null && cur !== "") {
        const p = schema[key];
        const rhs = p.type === "number" || p.type === "mods" ? `<${cur}>` : `"${cur}"`;
        edits.push({ start: b.insertAt, end: b.insertAt, text: `${b.indent}${p.dt} = ${rhs};\n` });
      }
    }
  }

  // (d) novos behaviors a inserir no nó `behaviors { }`
  const insert = model.behaviorsInsert;
  if (insert && insert.at != null && (model.newBehaviors || []).length) {
    const nodes = model.newBehaviors
      .map((nb) => "\n" + renderBehaviorNode(nb.ref, nb.compatible, { config: nb.config || {}, bindings: nb.bindings || [] }, insert.indent))
      .join("");
    edits.push({ start: insert.at, end: insert.at, text: nodes });
  }

  // Aplica da maior offset para a menor para não invalidar offsets pendentes.
  edits.sort((a, b) => b.start - a.start);
  let out = model.text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

// Snapshots para detectar mudanças ao salvar.
export function snapshotBindings(model) {
  return model.layers.map((l) => l.bindings.map(bindingToString));
}

export function snapshotDisplayNames(model) {
  return model.layers.map((l) => l.displayName);
}
