# keyboard-tester Specification

## Purpose
TBD - created by archiving change editor-polish-and-tester. Update Purpose after archive.
## Requirements
### Requirement: Modo tester com feedback de pressionamento
O sistema SHALL oferecer um modo de teste em que pressionar uma tecla física destaca a
posição correspondente no board (quando mapeável pela layer base) e registra o evento.

#### Scenario: Tecla mapeável é destacada
- **WHEN** no modo tester o usuário pressiona uma tecla cujo keycode casa com um `&kp` da layer base
- **THEN** a posição correspondente é destacada enquanto a tecla está pressionada

#### Scenario: Tecla não mapeável mostra o evento cru
- **WHEN** a tecla pressionada não casa com nenhum `&kp` da layer base (ex.: thumb/camada/mod-tap)
- **THEN** o sistema mostra a última tecla recebida (código do evento) sem destacar uma posição

### Requirement: Métricas de resposta da tecla
O sistema SHALL exibir, no modo tester, a contagem de pressionamentos e o tempo de hold, e
SHALL sinalizar chatter (repique/duplo disparo) quando ocorrer.

#### Scenario: Contagem e tempo de hold
- **WHEN** o usuário pressiona e solta teclas no modo tester
- **THEN** o sistema atualiza a contagem de pressionamentos e mostra o tempo entre pressionar e soltar

#### Scenario: Detecção de chatter
- **WHEN** uma tecla dispara dois eventos de pressionar em intervalo muito curto sem soltar entre eles
- **THEN** o sistema sinaliza chatter para aquela tecla

### Requirement: Limites explícitos do tester
O sistema SHALL deixar claro que o tester mede registro/resposta/tempo, não força analógica.

#### Scenario: Expectativa de pressão
- **WHEN** o usuário abre o modo tester
- **THEN** a UI indica que não há medição de pressão analógica (switches digitais) e que o foco é resposta/registro/tempo

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

