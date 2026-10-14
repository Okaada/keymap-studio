## ADDED Requirements

### Requirement: Ler e escrever `display-name` por layer
O sistema SHALL ler o `display-name` de cada layer quando presente e SHALL escrevê-lo
(atualizando o existente ou inserindo quando ausente) ao renomear, preservando o restante do arquivo.

#### Scenario: Inserir display-name numa layer sem nome
- **WHEN** uma layer sem `display-name` é renomeada e o keymap é salvo
- **THEN** o sistema insere `display-name = "<nome>";` no nó daquela layer e o resto do arquivo permanece intacto

#### Scenario: Atualizar display-name existente
- **WHEN** uma layer que já tem `display-name` é renomeada e o keymap é salvo
- **THEN** apenas o valor do `display-name` daquela layer muda, sem afetar o resto

#### Scenario: Round-trip no-op continua válido
- **WHEN** o keymap é parseado e salvo sem renomear nem editar bindings
- **THEN** o arquivo resultante é idêntico ao original

#### Scenario: Rename coexiste com edição de binding
- **WHEN** na mesma layer um binding é alterado e a layer é renomeada, e o keymap é salvo
- **THEN** tanto o `display-name` quanto o array `bindings` daquela layer refletem as mudanças, sem corromper offsets de outras layers
