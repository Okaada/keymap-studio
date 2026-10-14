## Why

O tester só destaca teclas na layer base. Nas outras layers nada acende, porque o índice
keycode→posição é montado **apenas** da layer 0 (e só de `&kp`), e não é refeito ao trocar de
aba. Resultado: ao ver/testar `navigation`, `raise_layer`, etc., as teclas pressionadas não
casam — "o tester nas outras layers não funciona".

## What Changes

- O tester passa a montar o índice keycode→posição a partir da **layer atualmente selecionada**
  (não só da base), e a **refazer o índice ao trocar de layer** no modo tester.
- O índice resolve mais behaviors em keycode testável: `&kp` (keycode), o **tap** de `&mt`/`&lt`
  e de hold-taps custom (`holdtap`, `mo_mt`), `&sk`; e resolve `&trans` **caindo na layer base**
  naquela posição.
- A UI deixa claro o modelo: o tester mapeia contra a **layer em tela**; para testar uma layer
  você precisa **ativá-la no teclado físico** (o firmware é quem decide o keycode enviado).

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `keyboard-tester`: o mapeamento de tecla física → posição passa a usar a layer selecionada
  (com resolução de `&trans`/hold-taps) e é atualizado ao trocar de layer.

## Impact

- **Código**: apenas frontend (`web/app.js`): substituir `baseKpIndex()` por um índice da layer
  ativa com resolução de behaviors + `&trans`; refazer o índice no `selectLayer` quando em modo
  tester; pequena nota/rótulo na UI do tester.
- **Sem** mudança de backend, parser/serializer, build/sync ou dependências.
- **Limite inerente (não-objetivo)**: o app não sabe a layer ativa do firmware; o casamento só
  ocorre quando a layer em tela corresponde à layer ativa no teclado.
