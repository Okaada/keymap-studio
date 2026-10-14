## Why

Behaviors como hold-tap têm ajustes importantes (tempo do hold, flavor, quick-tap…) que hoje
só existem "soltos" no `behaviors { }` do `.keymap` — o editor não os mostra nem deixa mexer.
Quando mapeio `&holdtap` ou `&mo_mt` numa tecla, não vejo nem configuro o comportamento. Quero
essa customização **organizada no app**, não jogada no arquivo.

## What Changes

- Novo **painel "Behaviors"** que lista os behaviors configuráveis do keymap (os hold-tap
  `holdtap` e `mo_mt`) e permite editar seus ajustes: `tapping-term-ms` (tempo do hold),
  `flavor`, `quick-tap-ms`, `require-prior-idle-ms`. Persistido no `.keymap` (round-trip).
- Na edição de uma **tecla** que usa um behavior configurável, mostra um resumo da config
  atual + **link** para abri-la no painel — para não ficar espalhado.
- **Validação** dos valores (os `-ms` são inteiros ≥ 0; `flavor` entre as opções válidas).
- O modelo deixa claro que a config fica na **definição** do behavior e vale para **todas** as
  teclas que o usam.

## Capabilities

### New Capabilities
- `behavior-config`: visualizar e editar a configuração dos behaviors configuráveis (hold-tap),
  com validação, acessível por um painel e por link a partir da tecla que usa o behavior.

### Modified Capabilities
- `keymap-model`: parsear as propriedades de configuração dos behaviors no nó `behaviors { }` e
  escrevê-las de volta (editar valor existente ou inserir propriedade ausente) com round-trip.

## Impact

- **Código**: parser (propriedades + offsets do nó `behaviors`), serializer (edições de
  propriedades de behavior reaproveitando a lista de edições por offset), endpoints de save,
  frontend (painel Behaviors + link na paleta da tecla), validação.
- **Sem** novas dependências nem mudança no build/sync.
- **Não-objetivos**: criar novos behaviors do zero; customizar os `&mt`/`&lt` **embutidos**
  (exigiria gerar um behavior custom); config por-tecla; sticky-key/tap-dance/macro/combo;
  flags booleanas (`retro-tap`, `hold-trigger-on-release`).
