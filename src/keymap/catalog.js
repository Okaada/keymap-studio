// Catálogo declarativo dos behaviors ZMK mais comuns.
// Dirige a paleta da UI (o que pode ser mapeado) e a validação de aridade (D4).
//
// Cada entrada: ref (sem o `&`), label, params[].
// Cada param: { name, type } onde type ∈ keycode | layer | mod | bt | out | number | raw
// min/max: aridade mínima/máxima aceita (default = params.length).

export const BEHAVIORS = [
  { ref: "kp", label: "Key press", desc: "Envia uma tecla enquanto pressionada.", params: [{ name: "key", type: "keycode" }] },
  { ref: "mt", label: "Mod-tap (hold mod / tap key)", desc: "Segurar = modificador; tocar = tecla.", params: [{ name: "hold (mod)", type: "mod" }, { name: "tap (key)", type: "keycode" }] },
  { ref: "lt", label: "Layer-tap (hold layer / tap key)", desc: "Segurar = ativa a layer; tocar = tecla.", params: [{ name: "hold (layer)", type: "layer" }, { name: "tap (key)", type: "keycode" }] },
  { ref: "mo", label: "Momentary layer", desc: "Ativa a layer só enquanto segurada.", params: [{ name: "layer", type: "layer" }] },
  { ref: "to", label: "To layer (switch)", desc: "Troca para a layer e permanece nela.", params: [{ name: "layer", type: "layer" }] },
  { ref: "tog", label: "Toggle layer", desc: "Liga/desliga a layer a cada toque.", params: [{ name: "layer", type: "layer" }] },
  { ref: "sk", label: "Sticky key", desc: "Fica 'grudada' para a próxima tecla (ex.: Shift de um toque).", params: [{ name: "key/mod", type: "keycode" }] },
  { ref: "sl", label: "Sticky layer", desc: "Ativa a layer só para a próxima tecla.", params: [{ name: "layer", type: "layer" }] },
  { ref: "trans", label: "Transparent (herda a layer de baixo)", desc: "Deixa passar a tecla da layer inferior.", params: [] },
  { ref: "none", label: "None (desativa a tecla)", desc: "Nada acontece ao pressionar.", params: [] },
  { ref: "bt", label: "Bluetooth", desc: "Comando Bluetooth (selecionar/limpar perfil).", params: [{ name: "cmd", type: "bt" }, { name: "index", type: "number" }], min: 1, max: 2 },
  { ref: "out", label: "Output (USB/BLE)", desc: "Escolhe a saída: USB, BLE ou alternar.", params: [{ name: "cmd", type: "out" }] },
  { ref: "caps_word", label: "Caps word", desc: "Caps Lock que desliga sozinho no fim da palavra.", params: [] },
  { ref: "key_repeat", label: "Repeat last key", desc: "Repete a última tecla enviada.", params: [] },
  { ref: "sys_reset", label: "Reset (reboot)", desc: "Reinicia o teclado.", params: [] },
  { ref: "bootloader", label: "Bootloader", desc: "Entra no bootloader para regravar o firmware.", params: [] },
];

// Descrição amigável por TIPO de parâmetro (fallback quando o param não tem desc própria).
export const PARAM_TYPE_DESC = {
  keycode: "A tecla/código enviado (ex.: A, N1, SPACE, LEFT).",
  layer: "A layer de destino (escolha pelo índice/nome).",
  mod: "Um modificador: Shift, Ctrl, Alt ou GUI (⌘/Win).",
  bt: "Comando Bluetooth (BT_SEL n, BT_CLR, …).",
  out: "Saída do teclado: USB, BLE ou alternar.",
  number: "Um número inteiro.",
  raw: "Valor livre (texto conforme o behavior espera).",
};

// Tokens sugeridos para params não-keycode (alimentam dropdowns na UI).
export const PARAM_OPTIONS = {
  mod: ["LSHIFT", "RSHIFT", "LCTRL", "RCTRL", "LALT", "RALT", "LGUI", "RGUI"],
  bt: ["BT_SEL", "BT_CLR", "BT_CLR_ALL", "BT_NXT", "BT_PRV"],
  out: ["OUT_USB", "OUT_BLE", "OUT_TOG"],
};

const BY_REF = new Map(BEHAVIORS.map((b) => [b.ref, b]));

export function baseBehavior(ref) {
  return BY_REF.get(ref) || null;
}

export function arityOf(entry) {
  const n = entry.params.length;
  return { min: entry.min ?? n, max: entry.max ?? n };
}

// Catálogo efetivo = catálogo base + behaviors custom descobertos no arquivo.
// customBehaviors: [{ ref, arity }] vindos do nó `behaviors {}` (via #binding-cells).
export function effectiveCatalog(customBehaviors = []) {
  const list = BEHAVIORS.map((b) => ({ ...b, custom: false }));
  for (const c of customBehaviors) {
    if (BY_REF.has(c.ref)) continue;
    const params = Array.from({ length: c.arity }, (_, i) => ({ name: `arg${i + 1}`, type: "raw" }));
    list.push({ ref: c.ref, label: `${c.ref} (custom)`, params, custom: true });
  }
  return list;
}
