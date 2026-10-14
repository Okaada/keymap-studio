## ADDED Requirements

### Requirement: Parse genérico dos nós de behavior
O sistema SHALL parsear cada nó do `behaviors { }` capturando o nome, o `compatible`,
`#binding-cells`, o conteúdo de `bindings` e as propriedades escalares conhecidas do tipo (com a
região do valor quando presente), não se limitando a hold-taps.

#### Scenario: Behavior não hold-tap
- **WHEN** o keymap define um behavior com `compatible` diferente de hold-tap (ex.: macro)
- **THEN** o modelo expõe esse behavior com seu `compatible`, bindings e propriedades conhecidas

### Requirement: Inserir um novo nó de behavior com round-trip
O sistema SHALL inserir um novo nó de behavior no `behaviors { }` (nome, `compatible`,
`#binding-cells`, `bindings` e propriedades) preservando o restante do arquivo.

#### Scenario: Criar um novo behavior
- **WHEN** um novo behavior é definido e o keymap é salvo
- **THEN** um novo nó é inserido no `behaviors { }` e o restante do arquivo permanece intacto

#### Scenario: Round-trip no-op continua válido
- **WHEN** o keymap é parseado e salvo sem criar/alterar behaviors (nem bindings/nomes)
- **THEN** o arquivo resultante é idêntico ao original
