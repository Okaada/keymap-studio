## ADDED Requirements

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
