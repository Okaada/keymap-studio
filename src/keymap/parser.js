// Parser focado do ZMK `.keymap` (D2): entende apenas o que a UI edita —
// as layers do nó `keymap` e suas sequências de bindings — e captura os offsets
// exatos do conteúdo de cada `bindings = < ... >` para permitir round-trip.
//
// Modelo retornado:
// {
//   text,                       // texto original completo (fonte p/ serializar)
//   layers: [{ name, displayName, start, end, bindings:[{ref,params}] }],
//   customBehaviors: [{ ref, arity }]
// }
// start/end delimitam o conteúdo INTERNO de `bindings = <` ... `>` (sem os sinais).

import { typeFor } from "./behaviorTypes.js";

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

// Encontra o índice do `}` que fecha o `{` em openBraceIdx (contagem de profundidade).
function matchBrace(text, openBraceIdx) {
  let depth = 0;
  for (let i = openBraceIdx; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Tokeniza o conteúdo de um bindings em bindings individuais.
// Cada binding começa em `&`; os params vão até o próximo `&`.
function tokenizeBindings(inner) {
  const clean = stripComments(inner);
  const bindings = [];
  const re = /&\s*([A-Za-z0-9_]+)([^&]*)/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const ref = m[1];
    const params = m[2].trim().split(/\s+/).filter(Boolean);
    bindings.push({ ref, params });
  }
  return bindings;
}

// Localiza a região do nó `keymap { ... }`.
function findKeymapRegion(text) {
  const m = /(?<![\w-])keymap\s*\{/.exec(text);
  if (!m) return null;
  const open = text.indexOf("{", m.index);
  const close = matchBrace(text, open);
  if (close === -1) return null;
  return { innerStart: open + 1, innerEnd: close };
}

function leadingIndent(body, idx) {
  const lineStart = body.lastIndexOf("\n", idx - 1) + 1;
  const m = /^([\t ]*)/.exec(body.slice(lineStart, idx));
  return m ? m[1] : "            ";
}

// Lê o valor de uma propriedade do corpo de um nó, conforme o tipo do schema.
// Retorna { region:{start,end}|null, value } com offsets absolutos (bodyAbs + relativo).
function readProp(body, bodyAbs, prop) {
  if (prop.type === "number" || prop.type === "mods") {
    const pm = new RegExp(prop.dt + "\\s*=\\s*<\\s*([^>]*?)\\s*>").exec(body);
    if (pm) {
      const rel = pm.index + pm[0].indexOf(pm[1]);
      return { region: { start: bodyAbs + rel, end: bodyAbs + rel + pm[1].length }, value: prop.type === "number" ? Number(pm[1]) : pm[1] };
    }
  } else {
    const pm = new RegExp(prop.dt + '\\s*=\\s*"([^"]*)"').exec(body);
    if (pm) {
      const rel = pm.index + pm[0].indexOf('"') + 1;
      return { region: { start: bodyAbs + rel, end: bodyAbs + rel + pm[1].length }, value: pm[1] };
    }
  }
  return { region: null, value: null };
}

// Parseia o nó `behaviors { ... }` de forma genérica (dirigida pelo schema de tipo):
// nome, compatible, aridade, props conhecidas (com região) e ponto de inserção.
// Retorna { list, insertAt, childIndent } (insertAt = antes do `}` do nó behaviors).
function parseBehaviors(text) {
  const m = /(?<![\w-])behaviors\s*\{/.exec(text);
  if (!m) return { list: [], insertAt: null, childIndent: "        " };
  const open = text.indexOf("{", m.index);
  const close = matchBrace(text, open);
  if (close === -1) return { list: [], insertAt: null, childIndent: "        " };
  const region = text.slice(open + 1, close);
  const regionBase = open + 1;

  const out = [];
  let childIndent = null;
  const nodeRe = /([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)\s*\{/g;
  let nm;
  while ((nm = nodeRe.exec(region)) !== null) {
    const nodeOpen = region.indexOf("{", nm.index);
    const nodeClose = matchBrace(region, nodeOpen);
    if (nodeClose === -1) continue;
    const body = region.slice(nodeOpen + 1, nodeClose);
    const bodyAbs = regionBase + nodeOpen + 1;
    if (childIndent == null) childIndent = leadingIndent(region, nm.index);

    const cells = /#binding-cells\s*=\s*<\s*(\d+)\s*>/.exec(body);
    const compatible = /compatible\s*=\s*"([^"]*)"/.exec(body)?.[1] || null;
    const type = typeFor(compatible);
    const isHoldTap = compatible === "zmk,behavior-hold-tap";

    // Ponto de inserção de propriedade ausente: após a linha do #binding-cells.
    const bc = /#binding-cells[^\n]*\n/.exec(body);
    const propInsertAt = bc ? bodyAbs + bc.index + bc[0].length : bodyAbs + body.length;
    const propIndent = bc ? leadingIndent(body, bc.index) : "            ";

    const config = {};
    const props = {};
    if (type) {
      for (const prop of type.props) {
        const r = readProp(body, bodyAbs, prop);
        props[prop.key] = r.region ? { ...r.region, dt: prop.dt, type: prop.type } : null;
        config[prop.key] = r.value;
      }
    }

    out.push({ ref: nm[1], compatible, isHoldTap, type: type ? { bindingMode: type.bindingMode } : null, arity: cells ? Number(cells[1]) : 0, config, props, insertAt: propInsertAt, indent: propIndent });
  }

  // Inserção de novo nó: na quebra de linha que antecede o `}` do `behaviors`.
  return { list: out, insertAt: text.lastIndexOf("\n", close), childIndent: childIndent || "        " };
}

export function parseKeymap(text) {
  const region = findKeymapRegion(text);
  if (!region) throw new Error("Nó `keymap` não encontrado no arquivo.");

  const layers = [];
  // Itera os `bindings = <` ANCORADOS (não `sensor-bindings`) dentro do keymap.
  const bindRe = /(?<![\w-])bindings\s*=\s*</g;
  bindRe.lastIndex = region.innerStart;
  let bm;
  while ((bm = bindRe.exec(text)) !== null) {
    if (bm.index >= region.innerEnd) break;
    const ltPos = text.indexOf("<", bm.index);
    const gtPos = text.indexOf(">", ltPos);
    if (gtPos === -1) break;
    const start = ltPos + 1;
    const end = gtPos;
    const inner = text.slice(start, end);

    // Nome da layer = identificador imediatamente antes do `{` que envolve este bindings.
    const braceBefore = text.lastIndexOf("{", bm.index);
    const pre = text.slice(0, braceBefore).trimEnd();
    const name = /([A-Za-z0-9_]+)$/.exec(pre)?.[1] || "layer";

    // display-name opcional dentro do corpo da layer.
    const layerBodyEnd = matchBrace(text, braceBefore);
    const layerBody = text.slice(braceBefore, layerBodyEnd === -1 ? end : layerBodyEnd);
    const dn = /display-name\s*=\s*"([^"]*)"/.exec(layerBody);

    // Para o round-trip do rename: região do valor (se existe) ou ponto de inserção (após `{`)
    // com a indentação da linha do `bindings`.
    let dnValue = null;
    if (dn) {
      const vStart = braceBefore + dn.index + dn[0].indexOf('"') + 1;
      dnValue = { start: vStart, end: vStart + dn[1].length };
    }
    const indentMatch = /\n([\t ]*)[^\n]*bindings\s*=/.exec(layerBody);
    const dnIndent = indentMatch ? indentMatch[1] : "            ";

    layers.push({
      name,
      displayName: dn ? dn[1] : null,
      start,
      end,
      bindings: tokenizeBindings(inner),
      dnValue,
      dnInsertAt: braceBefore + 1,
      dnIndent,
    });
    bindRe.lastIndex = end;
  }

  if (layers.length === 0) throw new Error("Nenhuma layer com `bindings` encontrada no nó `keymap`.");

  const beh = parseBehaviors(text);
  return {
    text,
    layers,
    behaviors: beh.list,
    behaviorsInsert: { at: beh.insertAt, indent: beh.childIndent },
    newBehaviors: [],
    customBehaviors: beh.list.map((b) => ({ ref: b.ref, arity: b.arity })),
  };
}

export function bindingToString(b) {
  return b.params.length ? `&${b.ref} ${b.params.join(" ")}` : `&${b.ref}`;
}
