## ADDED Requirements

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
