# visual-keymap-editor Specification

## Purpose
TBD - created by archiving change zmk-visual-configurator. Update Purpose after archive.
## Requirements
### Requirement: Layout físico do Lily58 por layer
O sistema SHALL exibir o teclado Lily58 em seu layout físico (split, com cluster de polegar),
mostrando uma layer por vez e permitindo alternar entre as layers existentes no keymap.

#### Scenario: Selecionar uma layer
- **WHEN** o usuário seleciona uma layer na UI
- **THEN** o layout mostra o binding atual de cada posição de tecla daquela layer

#### Scenario: Posições correspondem ao keymap
- **WHEN** o keymap tem N posições na layer
- **THEN** cada binding é renderizado na posição física correta do Lily58, sem sobra nem falta

### Requirement: Exibir o que está mapeado em cada tecla
O sistema SHALL mostrar, em cada tecla, uma representação legível do binding mapeado
(behavior e parâmetros), distinguindo visualmente `&trans` e `&none`.

#### Scenario: Tecla com mod-tap
- **WHEN** uma tecla usa `&mt LSHIFT A`
- **THEN** a tecla mostra de forma legível o hold (LSHIFT) e o tap (A)

#### Scenario: Tecla transparente
- **WHEN** uma tecla usa `&trans`
- **THEN** a tecla é exibida com indicação visual de "transparente" (herda a layer de baixo)

### Requirement: Paleta de funções/behaviors disponíveis
O sistema SHALL apresentar uma paleta das funções/behaviors que podem ser mapeados, com os
parâmetros que cada um exige, e permitir atribuir um behavior a uma tecla selecionada.

#### Scenario: Atribuir behavior do catálogo a uma tecla
- **WHEN** o usuário seleciona uma tecla e escolhe um behavior da paleta, preenchendo seus parâmetros
- **THEN** o binding daquela posição é atualizado no modelo e refletido na tecla

#### Scenario: Parâmetro de layer em behaviors de camada
- **WHEN** o usuário escolhe `&mo`, `&lt`, `&to` ou `&tog`
- **THEN** a paleta oferece escolher uma das layers existentes como parâmetro

### Requirement: Persistir edições no arquivo
O sistema SHALL salvar as edições de volta no `.keymap` usando o round-trip do `keymap-model`.

#### Scenario: Salvar edições
- **WHEN** o usuário aciona "salvar" após editar teclas
- **THEN** o `.keymap` é reescrito com os bindings atualizados e o restante preservado

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

### Requirement: Board centralizado
O sistema SHALL renderizar o board do teclado centralizado horizontalmente na área principal,
sem alterar as posições físicas nem a escala das teclas.

#### Scenario: Board centralizado na página
- **WHEN** o editor é exibido
- **THEN** o board aparece horizontalmente centralizado (não colado à esquerda), preservando o layout físico do Lily58

