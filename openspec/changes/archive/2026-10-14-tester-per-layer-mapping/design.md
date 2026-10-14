## Context

O tester (em `web/app.js`) escuta `keydown`/`keyup` globais e destaca a posição física cujo
keycode casa com o evento. Hoje o índice vem de `baseKpIndex()` — só `layers[0]` e só `&kp` —
montado uma vez em `toggleTester()` e nunca refeito. Por isso só a base funciona.

Fato de fundo (inevitável num app web): os eventos chegam com o keycode que o **firmware**
emite na sua layer ativa; o app não tem como saber qual é. Logo, o melhor que o app pode fazer
é mapear contra a layer que o usuário **seleciona/visualiza** — e o usuário ativa essa layer no
teclado para testá-la.

## Goals / Non-Goals

**Goals:**
- Testar qualquer layer: o índice keycode→posição reflete a **layer selecionada**.
- Refazer o índice ao trocar de layer no modo tester.
- Resolver mais behaviors em keycode testável e tratar `&trans` caindo na base.
- Deixar o modelo claro na UI (ativar a layer no teclado físico).

**Non-Goals:**
- Detectar a layer ativa do firmware automaticamente (impossível via eventos de teclado web).
- Pressão analógica / latência por switch (já fora de escopo).

## Decisions

### D1 — Índice a partir da layer selecionada, refeito ao trocar
`layerKpIndex(i)` monta o índice da layer `i`; `toggleTester()` e `selectLayer()` (quando
`state.tester`) chamam-no para `state.active`. _Por quê:_ corrige diretamente o bug — cada
layer passa a ter seu próprio mapa. _Alternativa rejeitada:_ união de todas as layers — gera
colisões de keycode (ex.: números em várias layers) e destaque ambíguo.

### D2 — Resolver keycode testável por behavior, com `&trans` → base
Para cada posição, o keycode testável é:
- `&kp K` → `K`; `&sk K` → `K`
- `&mt MOD K` / `&lt L K` → `K` (tap = último parâmetro)
- hold-taps custom de 2 células (`holdtap`, `mo_mt`) → último parâmetro (tap)
- `&trans` → resolve a mesma posição na **layer base** (fall-through de 1 nível)
- demais (`&none`, `&mo/&to/&tog`, `&bt/&out`, `&sys_reset`, …) → sem keycode (não mapeável)
_Por quê:_ aumenta a cobertura de teclas testáveis e torna `&trans` significativo (ele herda a
base). _Alternativa rejeitada:_ resolução completa da pilha de layers do ZMK — complexa demais
para o ganho; o fall-through de 1 nível basta para este keymap.

### D3 — Deixar o modelo explícito na UI
O painel do tester mostra contra qual layer está mapeando e lembra: "ative esta layer no
teclado para testá-la". _Por quê:_ evita a percepção de bug quando a layer em tela ≠ layer ativa
no firmware.

## Risks / Trade-offs

- **Layer em tela ≠ layer ativa no firmware** → sem casamento; mitigado pela nota na UI (D3).
- **`&trans` em cadeia por várias layers** → resolvemos só 1 nível (até a base); suficiente para
  o keymap atual (layers planas sobre a base). Se não casar, a tecla fica não-mapeável (comportamento honesto).
- **Colisão de keycodes dentro da mesma layer** (keycode repetido) → o índice fica com a última
  posição; aceitável (raro e sem impacto prático no teste).

## Open Questions

- Mostrar contagem "mapeáveis/58" por layer para sinalizar quão testável ela é (incremento simples; provável incluir).
