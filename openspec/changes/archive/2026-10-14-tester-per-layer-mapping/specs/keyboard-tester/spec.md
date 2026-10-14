## ADDED Requirements

### Requirement: Mapeamento do tester segue a layer selecionada
O sistema SHALL montar o índice keycode→posição a partir da layer atualmente selecionada e
SHALL refazê-lo ao trocar de layer durante o modo tester, de modo que qualquer layer possa ser testada.

#### Scenario: Trocar de layer no modo tester
- **WHEN** o usuário está no modo tester e seleciona outra layer
- **THEN** o índice passa a refletir os bindings daquela layer (pressionar a tecla correspondente a destaca)

#### Scenario: Tecla específica de uma layer não-base
- **WHEN** a layer selecionada tem `&kp F1` numa posição e essa layer está ativa no teclado físico
- **THEN** pressionar F1 destaca a posição correspondente naquela layer

### Requirement: Resolução de behaviors e transparência no tester
O sistema SHALL resolver o keycode testável de cada posição a partir do behavior (`&kp`, tap de
`&mt`/`&lt` e de hold-taps custom, `&sk`) e SHALL resolver `&trans` caindo na layer base na mesma posição.

#### Scenario: Posição com mod-tap
- **WHEN** uma posição usa `&mt MOD KEY` na layer testada
- **THEN** pressionar KEY (o tap) destaca aquela posição

#### Scenario: Posição transparente herda a base
- **WHEN** uma posição é `&trans` na layer testada e a base tem `&kp K` nessa posição
- **THEN** pressionar K destaca aquela posição

#### Scenario: Posição sem keycode não é mapeável
- **WHEN** uma posição é `&none`, `&mo`, `&bt`, etc. na layer testada
- **THEN** o sistema não associa um keycode àquela posição (sem destaque falso)

### Requirement: Modelo do tester explícito na UI
O sistema SHALL indicar na UI contra qual layer o tester está mapeando e que a layer precisa
estar ativa no teclado físico para ser testada.

#### Scenario: Aviso de layer ativa
- **WHEN** o usuário está no modo tester
- **THEN** a UI mostra a layer alvo do mapeamento e orienta ativá-la no teclado para testar
