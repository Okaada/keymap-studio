## Why

O editor já mapeia teclas, mas três coisas atrapalham o uso diário: (1) não dá pra renomear
as layers (ficam presas ao nome do nó, ex. `layer_3`), (2) o board está visualmente apertado
— teclas coladas e o texto dentro delas quebra/transborda, e (3) não há como testar se o
teclado está respondendo bem (tecla registrando, repetindo à toa, etc.). Quero resolver os
três pra deixar o editor agradável e útil além de só editar.

## What Changes

- **Renomear layers** pela UI: define/edita o `display-name` da layer no `.keymap`
  (round-trip preserva o resto). O nome do nó não muda; os índices de layer continuam válidos.
- **Layout mais agradável**: espaçamento entre as teclas, teclas maiores e **rótulos legíveis
  sem quebrar** (abreviações/glyphs para keycodes longos, sem overflow; tooltip com o binding completo).
- **Keyboard tester**: um modo que dá feedback visual ao pressionar as teclas físicas,
  contagem de pressionamentos, tempo de hold e detecção de **chatter** (repique/duplo disparo).
- Escopo mantém **local + Lily58**.

## Capabilities

### New Capabilities
- `keyboard-tester`: modo de teste com feedback de pressionamento, contagem, tempo de hold e
  detecção de chatter, mapeando a tecla física via a layer base.

### Modified Capabilities
- `keymap-model`: passa a ler e escrever o `display-name` de cada layer (round-trip), além dos bindings.
- `visual-keymap-editor`: renomear layers pela UI e renderização com espaçamento e rótulos legíveis.

## Impact

- **Código**: parser/serializer (capturar e escrever `display-name`; serializer generalizado
  para aplicar múltiplas edições por offset), endpoints de rename, e frontend (render do board,
  mapa de rótulos, UI de rename, modo tester).
- **Sem novas dependências**; sem mudança no fluxo de build/sync.
- **Não-objetivos**: **pressão analógica** (o Lily58 tem switches digitais MX; HID não reporta
  força), medição de latência por switch (exige firmware/ferramenta no host), outros teclados.
