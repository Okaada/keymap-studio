## ADDED Requirements

### Requirement: Renomear layers pela UI
O sistema SHALL permitir renomear uma layer pela interface, persistindo o novo nome via
`display-name` no `.keymap`, e refletir o nome nas abas e nos seletores de layer.

#### Scenario: Renomear uma layer
- **WHEN** o usuário renomeia uma layer na UI e salva
- **THEN** a aba/seletor passa a mostrar o novo nome e o `.keymap` grava o `display-name` correspondente

#### Scenario: Nome usado nos seletores de layer dos behaviors
- **WHEN** uma layer é renomeada
- **THEN** os dropdowns de layer (ex.: para `&mo`/`&lt`) mostram o novo nome junto do índice

### Requirement: Layout legível com espaçamento e rótulos sem overflow
O sistema SHALL renderizar o board com espaçamento visível entre as teclas e rótulos que não
quebram nem transbordam, mantendo o binding completo acessível via tooltip.

#### Scenario: Rótulo longo não transborda
- **WHEN** uma tecla tem um keycode longo (ex.: `LEFT_SHIFT`, `BACKSPACE`)
- **THEN** a tecla mostra um rótulo curto/legível sem quebrar o texto, e o binding completo aparece no tooltip

#### Scenario: Espaçamento entre teclas
- **WHEN** o board é renderizado
- **THEN** há espaço visível entre teclas adjacentes (as teclas não ficam coladas), preservando as posições físicas do Lily58
