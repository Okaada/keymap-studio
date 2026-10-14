// Registro dos tipos de behavior do nó `behaviors { }` (D1): fonte única que dirige as
// descrições (#1) e o formulário de criar/editar (#2). Adicionar um tipo é só dado aqui.
//
// Cada tipo: compatible → {
//   label, bindingCells, bindingMode: "slots"|"sequence"|"none",
//   slots?: [{name, desc, default}],          // para bindingMode "slots"
//   props: [{ key, dt, type, desc, options? }] // type ∈ number | enum | mods | raw
// }

export const FLAVOR_OPTIONS = ["tap-preferred", "hold-preferred", "balanced", "tap-unless-interrupted"];

export const BEHAVIOR_TYPES = {
  "zmk,behavior-hold-tap": {
    label: "Hold-tap (segurar vs. tocar)",
    bindingCells: 2,
    bindingMode: "slots",
    slots: [
      { name: "hold", desc: "O que faz ao SEGURAR (ex.: &kp LSHIFT, &mo 1).", default: "&kp" },
      { name: "tap", desc: "O que faz ao TOCAR (ex.: &kp ESC).", default: "&kp" },
    ],
    props: [
      { key: "tappingTermMs", dt: "tapping-term-ms", type: "number", desc: "Tempo (ms) até virar 'hold'. Menor = hold mais fácil." },
      { key: "quickTapMs", dt: "quick-tap-ms", type: "number", desc: "Tocar de novo dentro desse tempo repete o tap (auto-repeat)." },
      { key: "requirePriorIdleMs", dt: "require-prior-idle-ms", type: "number", desc: "Só vira hold se o teclado ficou parado esse tempo antes (evita holds acidentais ao digitar rápido)." },
      { key: "flavor", dt: "flavor", type: "enum", options: FLAVOR_OPTIONS, desc: "Como decidir tap vs. hold: hold-preferred favorece o hold; tap-preferred o tap; balanced/tap-unless-interrupted são intermediários." },
    ],
  },
  "zmk,behavior-mod-morph": {
    label: "Mod-morph (muda com modificador)",
    bindingCells: 0,
    bindingMode: "slots",
    slots: [
      { name: "normal", desc: "Comportamento normal (ex.: &kp COMMA).", default: "&kp" },
      { name: "morphed", desc: "Quando o modificador está pressionado (ex.: &kp SEMI).", default: "&kp" },
    ],
    props: [
      { key: "mods", dt: "mods", type: "mods", desc: "Modificadores que ativam a troca (ex.: MOD_LSFT|MOD_RSFT)." },
    ],
  },
  "zmk,behavior-sticky-key": {
    label: "Sticky key (grudenta)",
    bindingCells: 1,
    bindingMode: "slots",
    slots: [{ name: "binding", desc: "O que gruda para a próxima tecla (ex.: &kp LSHIFT).", default: "&kp" }],
    props: [
      { key: "releaseAfterMs", dt: "release-after-ms", type: "number", desc: "Tempo (ms) que fica grudada esperando a próxima tecla." },
    ],
  },
  "zmk,behavior-tap-dance": {
    label: "Tap-dance (ações por nº de toques)",
    bindingCells: 0,
    bindingMode: "sequence",
    props: [
      { key: "tappingTermMs", dt: "tapping-term-ms", type: "number", desc: "Janela (ms) para contar toques seguidos." },
    ],
  },
  "zmk,behavior-macro": {
    label: "Macro (sequência de teclas)",
    bindingCells: 0,
    bindingMode: "sequence",
    props: [
      { key: "waitMs", dt: "wait-ms", type: "number", desc: "Espera (ms) entre os passos da macro." },
      { key: "tapMs", dt: "tap-ms", type: "number", desc: "Duração (ms) de cada toque na macro." },
    ],
  },
  "zmk,behavior-caps-word": {
    label: "Caps word",
    bindingCells: 0,
    bindingMode: "none",
    props: [
      { key: "continueList", dt: "continue-list", type: "raw", desc: "Teclas que NÃO desligam o caps-word (ex.: UNDERSCORE BACKSPACE)." },
    ],
  },
};

export function typeFor(compatible) {
  return BEHAVIOR_TYPES[compatible] || null;
}

// Opções de tipo para a UI de criação (compatible + label).
export function behaviorTypeOptions() {
  return Object.entries(BEHAVIOR_TYPES).map(([compatible, t]) => ({ compatible, label: t.label }));
}

// Gera o texto devicetree de um novo nó de behavior para inserção.
export function renderBehaviorNode(name, compatible, { config = {}, bindings = [] }, nodeIndent = "        ") {
  const t = typeFor(compatible);
  const pi = nodeIndent + "    ";
  const lines = [`${nodeIndent}${name}: ${name} {`, `${pi}compatible = "${compatible}";`, `${pi}label = "${name.toUpperCase()}";`, `${pi}#binding-cells = <${t.bindingCells}>;`];
  if (t.bindingMode === "slots") lines.push(`${pi}bindings = ${bindings.map((b) => `<${b}>`).join(", ")};`);
  else if (t.bindingMode === "sequence") lines.push(`${pi}bindings = <${bindings.join(" ")}>;`);
  for (const prop of t.props) {
    const v = config[prop.key];
    if (v == null || v === "") continue;
    const rhs = prop.type === "number" || prop.type === "mods" ? `<${v}>` : `"${v}"`;
    lines.push(`${pi}${prop.dt} = ${rhs};`);
  }
  lines.push(`${nodeIndent}};`);
  return lines.join("\n");
}
